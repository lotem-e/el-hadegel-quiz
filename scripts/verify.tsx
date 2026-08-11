// verify.tsx - every check this project relies on, in one command.
//   npm run verify
// Covers the quiz engine (composition + scoring), server-rendering of each
// screen, and the admin's unpublished-changes logic. Written as plain
// assertions so it needs no test framework.
//
// A minimal window stub lets components that touch the DOM render here.
;(globalThis as any).window = {
  location: { hash: '' },
  addEventListener: () => {},
  removeEventListener: () => {},
  setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
  clearTimeout: (id: number) => clearTimeout(id),
}

import { renderToString } from 'react-dom/server'
import { createElement } from 'react'
import App from '../src/App'
import Admin, { canonical, summarizeDiff } from '../src/screens/Admin'
import Quiz from '../src/screens/Quiz'
import Results from '../src/screens/Results'
import { selectQuizQuestions } from '../src/engine/selectQuestions'
import { scoreAnswers } from '../src/engine/scoring'
import type { Answer } from '../src/engine/scoring'
import { BASE_QUESTIONS } from '../src/content/questions'
import { DEFAULT_QUOTAS } from '../src/content/quizConfig'
import { PILLARS } from '../src/content/pillars'
import { categoryColor } from '../src/lib/categoryColors'

const QUIZ_LENGTH = Object.values(DEFAULT_QUOTAS).reduce((a, b) => a + b, 0)

let failures = 0
function check(name: string, condition: boolean) {
  if (!condition) {
    failures++
    console.error('  FAIL:', name)
  }
}
function expectContains(name: string, rawHtml: string, needles: string[]) {
  // renderToString inserts <!-- --> separators between dynamic and static
  // text; strip them so we assert on what a browser actually shows.
  const html = rawHtml.replace(/<!--.*?-->/g, '')
  for (const needle of needles) {
    if (!html.includes(needle)) {
      failures++
      console.error(`  FAIL: ${name} is missing "${needle}"`)
    }
  }
}

console.log('quiz engine')

// --- pool sanity ---
check('pool holds 54 statements', BASE_QUESTIONS.length === 54)
check('derived quiz length is 13', QUIZ_LENGTH === 13)
check('no duplicate ids in pool', new Set(BASE_QUESTIONS.map((q) => q.id)).size === BASE_QUESTIONS.length)

// --- selection: 500 random draws all respect the rules ---
for (let run = 0; run < 500; run++) {
  const picked = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS)
  check('selection length matches the mix', picked.length === QUIZ_LENGTH)
  check('no duplicates in selection', new Set(picked.map((q) => q.id)).size === picked.length)
  for (const [pillarId, quota] of Object.entries(DEFAULT_QUOTAS)) {
    const count = picked.filter((q) => q.pillarId === pillarId).length
    check(`pillar ${pillarId} quota respected`, count === quota)
  }
}

// --- selection respects the active flag ---
const withInactive = BASE_QUESTIONS.map((q) =>
  q.pillarId === 'zionist-unity' ? { ...q, active: false } : q,
)
for (let run = 0; run < 50; run++) {
  const picked = selectQuizQuestions(withInactive, DEFAULT_QUOTAS)
  check('inactive questions never picked', picked.every((q) => q.pillarId !== 'zionist-unity'))
  check('dry pillar shrinks the quiz', picked.length === QUIZ_LENGTH - DEFAULT_QUOTAS['zionist-unity'])
}

// --- pinned questions are always selected (within quota) ---
const withPinned = BASE_QUESTIONS.map((q) =>
  q.id === 'zionist-unity-5' || q.id === 'winning-iron-wall-18' ? { ...q, pinned: true } : q,
)
for (let run = 0; run < 200; run++) {
  const picked = selectQuizQuestions(withPinned, DEFAULT_QUOTAS)
  check(
    'pinned questions always included',
    picked.some((q) => q.id === 'zionist-unity-5') &&
      picked.some((q) => q.id === 'winning-iron-wall-18'),
  )
  check('quiz length exact with pins', picked.length === QUIZ_LENGTH)
}

// --- over-pinned pillar: the quota still wins (edge case 2) ---
const overPinned = BASE_QUESTIONS.map((q) =>
  q.pillarId === 'vision-victory' ? { ...q, pinned: true } : q,
)
for (let run = 0; run < 50; run++) {
  const picked = selectQuizQuestions(overPinned, DEFAULT_QUOTAS)
  const forPillar = picked.filter((q) => q.pillarId === 'vision-victory')
  check('over-pinned capped at quota', forPillar.length === DEFAULT_QUOTAS['vision-victory'])
  check('over-pinned selects among pinned', forPillar.every((q) => q.pinned))
}

// --- selections actually vary (randomness sanity) ---
const signatures = new Set<string>()
for (let run = 0; run < 20; run++) {
  signatures.add(
    selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS)
      .map((q) => q.id)
      .sort()
      .join(','),
  )
}
check('random draws differ across runs', signatures.size > 1)

// --- scoring math ---
const mk = (values: number[]): Answer[] =>
  values.map((value, i) => ({ questionId: `q${i}`, pillarId: i % 2 ? 'zionist-economy' : 'legal-reform', value }))

check('all 5s -> 100%', scoreAnswers(mk(Array(12).fill(5))).totalPercent === 100)
check('all 1s -> 0%', scoreAnswers(mk(Array(12).fill(1))).totalPercent === 0)
check('all 3s -> 50%', scoreAnswers(mk(Array(12).fill(3))).totalPercent === 50)
check('5 and 4 -> 88%', scoreAnswers(mk([5, 4])).totalPercent === 88)
check('empty -> 0, no pillars', scoreAnswers([]).totalPercent === 0 && scoreAnswers([]).byPillar.length === 0)

const perPillar = scoreAnswers(mk([5, 1, 5, 1]))
check(
  'per-pillar split correct',
  perPillar.byPillar.find((p) => p.pillarId === 'legal-reform')?.percent === 100 &&
    perPillar.byPillar.find((p) => p.pillarId === 'zionist-economy')?.percent === 0,
)


console.log('screens render')

// Landing (via App with empty hash)
const landing = renderToString(createElement(App))
expectContains('Landing', landing, ['מתחילים', 'כמה קרובים אתם', 'אל הדגל', 'לקריאת החזון המלא'])

// Quiz with a real random selection
const questions = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS)
const quiz = renderToString(createElement(Quiz, { questions, onFinish: () => {} }))
expectContains('Quiz', quiz, ['היגד 1 מתוך 13', 'מסכים/ה מאוד', 'כלל לא מסכים/ה', questions[0].text])

// Results: high score (pin CTA must appear) and low score (must not)
const high: Answer[] = questions.map((q) => ({ questionId: q.id, pillarId: q.pillarId, value: 5 }))
const highHtml = renderToString(createElement(Results, { answers: high, onRestart: () => {} }))
expectContains('Results-high', highHtml, ['100%', 'נועצים את הדגל', 'פירוט לפי עמודי החזון', 'שאלון חדש'])

const low: Answer[] = questions.map((q) => ({ questionId: q.id, pillarId: q.pillarId, value: 2 }))
const lowHtml = renderToString(createElement(Results, { answers: low, onRestart: () => {} }))
expectContains('Results-low', lowHtml, ['25%'])
if (lowHtml.includes('נועצים את הדגל')) {
  failures++
  console.error('FAIL: pin CTA shown below threshold')
}

// Admin - with Supabase configured, the first render is the loading state
// (data arrives async in the browser; renderToString never runs effects).
const admin = renderToString(createElement(Admin))
expectContains('Admin', admin, ['טוען את המאגר', 'התנתקות'])
if (admin.includes('ממשק ניהול')) {
  failures++
  console.error('FAIL: header badge still rendered in Admin')
}


console.log('content integrity')
check('every category has a colour of its own',
  new Set(PILLARS.map((p) => categoryColor(p.id))).size === PILLARS.length)
check('every category names at least one source',
  PILLARS.every((p) => p.sources.length > 0))
check('every source link is absolute',
  PILLARS.every((p) => p.sources.every((s) => s.url.startsWith('https://'))))
check('every statement belongs to a real category',
  BASE_QUESTIONS.every((q) => PILLARS.some((p) => p.id === q.pillarId)))

console.log('unpublished-changes logic')
const snapshot = {
  pillars: [
    { id: 'a', quota: 2, title: 'A', short: 'A', description: 'd', sources: [], sort_order: 0 },
    { id: 'b', quota: 1, title: 'B', short: 'B', description: 'd', sources: [], sort_order: 1 },
  ],
  questions: [
    { id: 'q1', text: 'one', pinned: false, pillar_id: 'a', sort_order: 0 },
    { id: 'q2', text: 'two', pinned: false, pillar_id: 'b', sort_order: 1 },
  ],
  config: { pin_flag_threshold: 90 },
}
const clone = () => JSON.parse(JSON.stringify(snapshot))
check('key order does not count as a change',
  canonical({ a: 1, b: { c: 2, d: 3 } }) === canonical({ b: { d: 3, c: 2 }, a: 1 }))
check('identical snapshots report nothing', summarizeDiff(clone(), clone()).length === 0)
let mutated = clone(); mutated.questions[0].text = 'ONE'
check('a reworded statement is reported', summarizeDiff(mutated, clone()).join() === 'ניסוח של היגד')
mutated = clone(); mutated.questions[0].pinned = true
check('a pin change is reported', summarizeDiff(mutated, clone()).join() === 'נעיצה של היגד')
mutated = clone(); mutated.questions.push({ id: 'q3', text: 'three', pinned: false, pillar_id: 'a', sort_order: 2 })
check('a new statement is reported', summarizeDiff(mutated, clone()).join() === 'היגד חדש')
mutated = clone(); mutated.questions.pop()
check('a deleted statement is reported', summarizeDiff(mutated, clone()).join() === 'היגד שנמחק')
mutated = clone(); mutated.pillars[0].quota = 3
check('a quota change is reported', summarizeDiff(mutated, clone()).join() === 'תמהיל של קטגוריה')
// the two fields the old hand-written check silently ignored
mutated = clone(); mutated.pillars[0].sort_order = 5
check('a category ORDER change is reported', summarizeDiff(mutated, clone()).join() === 'פרטים של קטגוריה')
check('a category ORDER change counts as unpublished', canonical(mutated) !== canonical(clone()))
mutated = clone(); mutated.config.pin_flag_threshold = 80
check('a settings change is reported', summarizeDiff(mutated, clone()).join() === 'הגדרות השאלון')
check('a settings change counts as unpublished', canonical(mutated) !== canonical(clone()))

if (failures === 0) {
  console.log('\nall checks passed')
} else {
  console.error(`\n${failures} checks failed`)
  process.exit(1)
}
