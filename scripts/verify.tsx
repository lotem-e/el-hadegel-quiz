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
import Admin, { aggregateAgreement, canonical, computeNextQuestionId, orderByCategory, summarizeDiff } from '../src/screens/Admin'
import Quiz from '../src/screens/Quiz'
import Results, { shortSourceLabel } from '../src/screens/Results'
import { selectQuizQuestions } from '../src/engine/selectQuestions'
import { scoreAnswers } from '../src/engine/scoring'
import type { Answer } from '../src/engine/scoring'
import { BASE_QUESTIONS } from '../src/content/questions'
import { DEFAULT_QUOTAS } from '../src/content/quizConfig'
import { PILLARS } from '../src/content/pillars'
import { categoryColor } from '../src/lib/categoryColors'
import { genderize, MALE, FEMALE } from 'ivrita/src/ivrita'
import { LIKERT_OPTIONS } from '../src/components/LikertScale'
import { p, renderPhrase } from '../src/lib/gender'
import type { Phrase } from '../src/lib/gender'

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
expectContains('Landing', landing, ['בואו נגלה', 'כמה קרובים אתם', 'אל הדגל', '13 היגדים', 'דקות'])
// the source links belong on the results screen now, not on the doorstep
check('landing carries no outbound links', !landing.includes('elhadegel.co.il/about-us'))

// Quiz with a real random selection
const questions = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS)
const quiz = renderToString(createElement(Quiz, { questions, onFinish: () => {} }))
expectContains('Quiz', quiz, ['היגד 1 מתוך 13', 'מסכים/ה מאוד', 'כלל לא מסכים/ה', questions[0].text])

// Results: high score (pin CTA must appear) and low score (must not)
const high: Answer[] = questions.map((q) => ({ questionId: q.id, pillarId: q.pillarId, value: 5 }))
const highHtml = renderToString(createElement(Results, { answers: high, onRestart: () => {} }))
expectContains('Results-high', highHtml, [
  '100%',
  // the verdict lives in the pin panel, with the action it justifies
  'הדגל הזה גם שלכם.',
  'נועצים את הדגל',
  'איפה התחברתם, ואיפה פחות',
  // every category row carries its sources as chips
  'המצע · עמ׳ 3-9',
  'נוסח החוק המלא',
  'elhadegel.co.il',
  'נסו שאלון חדש',
])
check('confetti only above the flag threshold', highHtml.includes('canvas'))
// above the threshold there is ONE action: no read-the-source buttons
check('no platform button above the threshold', !highHtml.includes('המצע המלא ↗'))

const low: Answer[] = questions.map((q) => ({ questionId: q.id, pillarId: q.pillarId, value: 2 }))
const lowHtml = renderToString(createElement(Results, { answers: low, onRestart: () => {} }))
expectContains('Results-low', lowHtml, [
  '25%',
  'נסכים שלא להסכים',
  'אם בכל זאת הסתקרנתם',
  'המצע המלא',
  'החזון שלנו',
  'elhadegel.co.il',
])
check('no confetti below the threshold', !lowHtml.includes('canvas'))
// the lowest band offers the source, not a conversation
check('no contact link in the far band', !lowHtml.includes('mailto:'))

// the band just under the flag: verdict + reading buttons + the contact link
const nearAnswers: Answer[] = questions.map((q) => ({ questionId: q.id, pillarId: q.pillarId, value: 4 }))
const nearHtml = renderToString(createElement(Results, { answers: nearAnswers, onRestart: () => {} }))
expectContains('Results-near', nearHtml, ['75%', 'אנחנו מחזיקים בדעות קרובות מאוד', 'מזמינים אתכם לחקור ולגלות', 'תסבירו לנו', 'mailto:info@elhadegel.com', 'המצע המלא'])
if (lowHtml.includes('נועצים את הדגל')) {
  failures++
  console.error('FAIL: pin CTA shown below threshold')
}

// the scale under the number anchors it against the pin threshold
check('the threshold tick is drawn', highHtml.includes('right:80%') || highHtml.includes('right: 80%'))

// source labels shrink to chip length, and unknown labels pass through
check('platform label shortens', shortSourceLabel('המצע המלא - מצע ביטחון ( עמ׳ 3-9 )') === 'המצע · עמ׳ 3-9')
check('vision label shortens', shortSourceLabel('החזון שלנו - כלכלה ציונית') === 'החזון · כלכלה ציונית')
check('the law label shortens', shortSourceLabel('הצעת חוק יסוד: שירות חובה למען המדינה ( נוסח מלא )') === 'נוסח החוק המלא')
check('an unknown label is untouched', shortSourceLabel('מקור חדש לגמרי') === 'מקור חדש לגמרי')

// the middle band: Lotem's wording, and its own contact label
const midAnswers: Answer[] = questions.map((q, i) => ({
  questionId: q.id, pillarId: q.pillarId, value: i % 2 === 0 ? 3 : 4,
}))
const midHtml = renderToString(createElement(Results, { answers: midAnswers, onRestart: () => {} }))
expectContains('Results-mid', midHtml, [
  'יש בינינו הרבה מן המשותף',
  'נראה שיש בינינו מחלוקות',
  'תסבירו לנו',
  'mailto:info@elhadegel.com',
])

// Admin - with Supabase configured, the first render is the loading state
// (data arrives async in the browser; renderToString never runs effects).
const admin = renderToString(createElement(Admin))
expectContains('Admin', admin, ['טוען את המאגר', 'התנתקות'])
if (admin.includes('ממשק ניהול')) {
  failures++
  console.error('FAIL: header badge still rendered in Admin')
}


console.log('repeat rounds')
// A second round must prefer statements the visitor has not met yet, and
// must never shrink because of it.
{
  const firstRound = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS)
  const seen = new Set(firstRound.map((q) => q.id))
  const secondRound = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS, seen)
  check('a second round is still full length', secondRound.length === firstRound.length)

  // Per category: repeats are allowed only once the unseen ones run out.
  for (const pillar of PILLARS) {
    const quota = DEFAULT_QUOTAS[pillar.id]
    if (!quota) continue
    const poolSize = BASE_QUESTIONS.filter((q) => q.pillarId === pillar.id && q.active).length
    const unseenLeft = poolSize - firstRound.filter((q) => q.pillarId === pillar.id).length
    const repeated = secondRound.filter((q) => q.pillarId === pillar.id && seen.has(q.id)).length
    const allowedRepeats = Math.max(0, quota - unseenLeft)
    check(`${pillar.short}: no needless repeat`, repeated <= allowedRepeats)
  }

  // Exhaust the pool: every statement seen, so a round must still fill up.
  const everything = new Set(BASE_QUESTIONS.map((q) => q.id))
  const exhausted = selectQuizQuestions(BASE_QUESTIONS, DEFAULT_QUOTAS, everything)
  check('a full pool of repeats still fills the quiz', exhausted.length === firstRound.length)
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

console.log('gendered address')
// Three addresses, Lotem's scheme: neutral is masculine PLURAL, male is
// masculine SINGULAR, female is feminine SINGULAR.
{
  const cases: Array<[Phrase, string, string, string]> = [
    [p('כמה קרובים אתם לדרך של אל הדגל?', 'כמה קרוב/ה את/ה לדרך של אל הדגל?'),
      'כמה קרובים אתם לדרך של אל הדגל?', 'כמה קרוב אתה לדרך של אל הדגל?', 'כמה קרובה את לדרך של אל הדגל?'],
    // The answers are the ONE place neutral keeps its slashes (Lotem's call):
    // they are the visitor's own words, not a form of address.
    [p('מסכים/ה מאוד', 'מסכים/ה מאוד'), 'מסכים/ה מאוד', 'מסכים מאוד', 'מסכימה מאוד'],
    [p('ניטרלי/ת', 'ניטרלי/ת'), 'ניטרלי/ת', 'ניטרלי', 'ניטרלית'],
    [p('עברתם את רף ה-', 'עברת את רף ה-'), 'עברתם את רף ה-', 'עברת את רף ה-', 'עברת את רף ה-'],
    [p('הכי התחברתם', 'הכי התחברת'), 'הכי התחברתם', 'הכי התחברת', 'הכי התחברת'],
    [p('מקומכם איתנו על המפה.', 'מקומך איתנו על המפה.'),
      'מקומכם איתנו על המפה.', 'מקומך איתנו על המפה.', 'מקומך איתנו על המפה.'],
    [p('רוצים לקרוא את המקור המלא?', 'רוצה לקרוא את המקור המלא?'),
      'רוצים לקרוא את המקור המלא?', 'רוצה לקרוא את המקור המלא?', 'רוצה לקרוא את המקור המלא?'],
    [p('בואו נגלה', 'בוא/י נגלה'), 'בואו נגלה', 'בוא נגלה', 'בואי נגלה'],
    [p('נועצים את הדגל', 'נועץ/ת את הדגל'), 'נועצים את הדגל', 'נועץ את הדגל', 'נועצת את הדגל'],
    [p('תסבירו לנו', 'תסביר/י לנו'), 'תסבירו לנו', 'תסביר לנו', 'תסבירי לנו'],
  ]
  for (const [phrase, neutral, male, female] of cases) {
    check(`neutral is masculine plural: ${neutral.slice(0, 20)}`, renderPhrase(phrase, 'neutral') === neutral)
    check(`male is masculine singular: ${male.slice(0, 20)}`, renderPhrase(phrase, 'male') === male)
    check(`female is feminine singular: ${female.slice(0, 20)}`, renderPhrase(phrase, 'female') === female)
  }
  // A slash must never survive into male or female, anywhere.
  for (const [phrase] of cases) {
    for (const mode of ['male', 'female'] as const) {
      check(`no slash left in ${mode}: ${phrase.plural.slice(0, 16)}`,
        !renderPhrase(phrase, mode).includes('/'))
    }
  }
  // In neutral a slash survives in exactly one place: the answers. Everything
  // that ADDRESSES the visitor must be clean.
  for (const option of LIKERT_OPTIONS) {
    check(`the answers keep their slash in neutral: ${option.label.plural}`,
      renderPhrase(option.label, 'neutral').includes('/'))
    check(`the answers still split for female: ${option.label.plural}`,
      !renderPhrase(option.label, 'female').includes('/'))
  }
  const addressing = [
    p('כמה קרובים אתם לדרך של אל הדגל?', 'כמה קרוב/ה את/ה לדרך של אל הדגל?'),
    p('בואו נגלה', 'בוא/י נגלה'),
    p('עברתם את רף ה-', 'עברת את רף ה-'),
    p('רוצים לקרוא את המקור המלא?', 'רוצה לקרוא את המקור המלא?'),
  ]
  for (const phrase of addressing) {
    check(`address is slash-free in neutral: ${phrase.plural.slice(0, 18)}`,
      !renderPhrase(phrase, 'neutral').includes('/'))
  }

  // Ivrita must still be incapable of touching plain text, because the
  // statements now flow through it too.
  for (const q of BASE_QUESTIONS) {
    check(`statement untouched: ${q.id}`,
      genderize(q.text, MALE) === q.text && genderize(q.text, FEMALE) === q.text)
  }
  // And Ivrita never guesses: plain masculine stays plain masculine.
  check('plain masculine is never inferred',
    genderize('אתם מסכימים', FEMALE) === 'אתם מסכימים')

  // The screens must open in masculine plural, with no slashes anywhere.
  const landing = renderToString(createElement(App)).replace(/<!--.*?-->/g, '')
  check('landing opens in masculine plural', landing.includes('כמה קרובים אתם'))
  check('landing shows no slash forms', !/[\u0590-\u05FF]+\/[\u0590-\u05FF]+/.test(landing))
}

console.log('new statement form')
{
  // Rendered offline (no database), the create button must not be offered -
  // there would be nothing to insert into.
  const adminOffline = renderToString(createElement(Admin)).replace(/<!--.*?-->/g, '')
  check('no create button without a database', !adminOffline.includes('היגד חדש'))
}

console.log('admin sorting')
{
  // Category grouping is stable: within a category the arrival order holds,
  // so a freshly created statement stays last in its own category.
  const qs = [
    { id: 'b-1', pillarId: 'b' }, { id: 'a-1', pillarId: 'a' },
    { id: 'b-2', pillarId: 'b' }, { id: 'a-2', pillarId: 'a' },
    { id: 'zz-9', pillarId: 'zz' },
  ]
  const ordered = orderByCategory(qs, ['a', 'b'])
  check('grouped in category order, stable within',
    ordered.map((q) => q.id).join(',') === 'a-1,a-2,b-1,b-2,zz-9')
  check('the input array is not mutated', qs[0].id === 'b-1')

  // Agreement aggregation: 1-5 maps to 0-100 exactly like the quiz score.
  const rows = [
    { answers: [{ questionId: 'q1', value: 5 }, { questionId: 'q2', value: 3 }] },
    { answers: [{ questionId: 'q1', value: 4 }] },
    { answers: 'garbage' },
    { answers: [{ questionId: 'q1', value: 99 }, { value: 5 }] },
  ]
  const agg = aggregateAgreement(rows)
  check('mean agreement on the quiz scale', agg.q1.avg === 88 && agg.q1.count === 2)
  check('a single answer stands alone', agg.q2.avg === 50 && agg.q2.count === 1)
  check('malformed rows are skipped, not crashed on', Object.keys(agg).length === 2)
}

console.log('new statement ids')
{
  const next = computeNextQuestionId
  // The case that motivates the whole rule: vision-victory holds 1 and 2, but
  // 3-8 were used and deleted. Only the published history remembers them.
  check('a retired number is never handed out again',
    next('vision-victory', ['vision-victory-1', 'vision-victory-2'],
      ['vision-victory-3', 'vision-victory-8']) === 'vision-victory-9')
  check('without history it still counts what exists',
    next('vision-victory', ['vision-victory-1', 'vision-victory-2'], []) === 'vision-victory-3')
  check('an empty category starts at 1', next('legal-reform', [], []) === 'legal-reform-1')
  check('another category does not shift the count',
    next('legal-reform', ['winning-iron-wall-22', 'legal-reform-8'], []) === 'legal-reform-9')
  check('a non-numeric suffix is ignored',
    next('legal-reform', ['legal-reform-2b', 'legal-reform-3'], []) === 'legal-reform-4')
  // The real pool must never produce an id that already exists.
  const live = BASE_QUESTIONS.map((q) => q.id)
  for (const pillar of PILLARS) {
    check(`live pool yields a free id for ${pillar.id}`,
      !live.includes(computeNextQuestionId(pillar.id, live, [])))
  }
}

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
