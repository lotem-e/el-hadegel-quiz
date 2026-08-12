// Admin.tsx - the backoffice, now backed by Supabase.
// Every edit here writes straight to the database and reaches all visitors
// immediately - no rebuild, no redeploy. Access is enforced by AuthGate +
// Row Level Security (only an authenticated session may write).
// Without a configured Supabase connection the screen falls back to a
// read-only view of the baked-in content.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Header from '../components/Header'
import IconButton, { EditIcon, PinIcon, PinOffIcon, TrashIcon } from '../components/IconButton'
import MixChart, { pillarSlices } from '../components/MixChart'
import { categoryColor } from '../lib/categoryColors'
import { PILLARS as BAKED_PILLARS } from '../content/pillars'
import { BASE_QUESTIONS } from '../content/questions'
import { DEFAULT_QUOTAS } from '../content/quizConfig'
import { PIN_FLAG_THRESHOLD } from '../content/quizConfig'
import { ANOTHER_ROUND_FLOOR, PARTIAL_FLOOR } from './Results'
import type { Pillar, PillarId, Question } from '../content/types'
import { supabase } from '../lib/supabaseClient'

interface PillarRow extends Pillar {
  quota: number
}

/** A content snapshot, exactly as publish_content() stores it */
interface Snapshot {
  pillars?: Array<Record<string, unknown>>
  questions?: Array<Record<string, unknown>>
  config?: Record<string, unknown>
}

/**
 * Order-independent JSON, so two snapshots are compared by their content
 * rather than by the order Postgres happened to serialise keys in.
 */
export function canonical(value: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort)
    if (v && typeof v === 'object') {
      const source = v as Record<string, unknown>
      return Object.keys(source)
        .sort()
        .reduce<Record<string, unknown>>((out, key) => {
          out[key] = sort(source[key])
          return out
        }, {})
    }
    return v
  }
  return JSON.stringify(sort(value))
}

/**
 * What differs between the draft and what is published, in her words.
 * Derived from the two snapshots themselves, so a newly added field can
 * never slip past it the way a hand-written field list did.
 */
export function summarizeDiff(draft: Snapshot, published: Snapshot): string[] {
  const byId = (rows: Array<Record<string, unknown>> = []) =>
    new Map(rows.map((row) => [row.id as string, row]))
  const dq = byId(draft.questions)
  const pq = byId(published.questions)
  const dp = byId(draft.pillars)
  const pp = byId(published.pillars)

  const added = [...dq.keys()].filter((id) => !pq.has(id)).length
  const removed = [...pq.keys()].filter((id) => !dq.has(id)).length
  let reworded = 0
  let pinChanged = 0
  for (const [id, q] of dq) {
    const before = pq.get(id)
    if (!before) continue
    if (before.text !== q.text) reworded++
    if ((before.pinned ?? false) !== (q.pinned ?? false)) pinChanged++
  }

  let quotaChanged = 0
  let categoryChanged = 0
  for (const [id, p] of dp) {
    const before = pp.get(id)
    if (!before) continue
    if (before.quota !== p.quota) quotaChanged++
    const strip = (row: Record<string, unknown>) => {
      const { quota: _quota, ...rest } = row
      return canonical(rest)
    }
    if (strip(before) !== strip(p)) categoryChanged++
  }
  const newCategories = [...dp.keys()].filter((id) => !pp.has(id)).length
  const configChanged = canonical(draft.config ?? {}) !== canonical(published.config ?? {})

  const parts: string[] = []
  if (added) parts.push(added === 1 ? 'היגד חדש' : `${added} היגדים חדשים`)
  if (removed) parts.push(removed === 1 ? 'היגד שנמחק' : `${removed} היגדים שנמחקו`)
  if (reworded) parts.push(reworded === 1 ? 'ניסוח של היגד' : `ניסוח של ${reworded} היגדים`)
  if (pinChanged) parts.push(pinChanged === 1 ? 'נעיצה של היגד' : `נעיצה של ${pinChanged} היגדים`)
  if (quotaChanged)
    parts.push(quotaChanged === 1 ? 'תמהיל של קטגוריה' : `תמהיל של ${quotaChanged} קטגוריות`)
  if (categoryChanged)
    parts.push(categoryChanged === 1 ? 'פרטים של קטגוריה' : `פרטים של ${categoryChanged} קטגוריות`)
  if (newCategories) parts.push(`${newCategories} קטגוריות חדשות`)
  if (configChanged) parts.push('הגדרות השאלון')
  return parts
}

function formatPublishedAt(iso: string): string {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

type Tab = 'questions' | 'mix' | 'stats'

function bakedPillarRows(): PillarRow[] {
  return BAKED_PILLARS.map((pillar) => ({ ...pillar, quota: DEFAULT_QUOTAS[pillar.id] }))
}

/**
 * The next id for a category: "<category>-<number>".
 *
 * The number is one past the highest ever used, counting BOTH the statements
 * that exist now and the ones that only survive in the published history.
 * vision-victory is the case that makes this necessary: it holds 1 and 2
 * today, but 3 through 8 were used and retired, so counting only what exists
 * would hand out 3 again - and Lotem's rule is that a retired id never
 * returns.
 */
export function computeNextQuestionId(
  pillarId: string,
  existingIds: Iterable<string>,
  everPublishedIds: Iterable<string>,
): string {
  const prefix = `${pillarId}-`
  let highest = 0
  const consider = (id: string) => {
    if (!id.startsWith(prefix)) return
    const suffix = id.slice(prefix.length)
    // Only a plain number counts, so a hand-made id like "legal-reform-2b"
    // cannot corrupt the count.
    if (!/^\d+$/.test(suffix)) return
    highest = Math.max(highest, Number(suffix))
  }
  for (const id of existingIds) consider(id)
  for (const id of everPublishedIds) consider(id)
  return `${prefix}${highest + 1}`
}

/**
 * The admin list is grouped by category, in the categories' own page order.
 * The sort is stable, so within a category the statements keep the order
 * they arrived in - and a statement Lotem just created stays last in its
 * own category instead of sinking to the bottom of the whole list.
 */
export function orderByCategory<T extends { pillarId: string }>(
  questions: T[],
  categoryOrder: string[],
): T[] {
  const rank = new Map(categoryOrder.map((id, index) => [id, index]))
  return [...questions].sort(
    (a, b) => (rank.get(a.pillarId) ?? 99) - (rank.get(b.pillarId) ?? 99),
  )
}

/**
 * Public agreement per statement, from the recorded results.
 *
 * Each result row carries the visitor's answers as [{questionId, value}].
 * value is the 1-5 Likert answer; it maps to 0-100 the same way the quiz
 * score does ((value-1)/4), so "the audience agrees 78%" reads on the same
 * scale as everything else. Malformed rows are skipped, never crash.
 */
export interface QuestionAgreement {
  avg: number
  count: number
  /** How many visitors picked each answer, from כלל לא מסכים/ה to מסכים/ה מאוד */
  dist: [number, number, number, number, number]
}

export function aggregateAgreement(
  rows: Array<{ answers: unknown }>,
): Record<string, QuestionAgreement> {
  const sums = new Map<string, { total: number; dist: [number, number, number, number, number] }>()
  for (const row of rows) {
    if (!Array.isArray(row.answers)) continue
    for (const answer of row.answers) {
      if (typeof answer?.questionId !== 'string') continue
      const value = Number(answer.value)
      if (!Number.isInteger(value) || value < 1 || value > 5) continue
      const entry = sums.get(answer.questionId) ?? { total: 0, dist: [0, 0, 0, 0, 0] }
      entry.total += ((value - 1) / 4) * 100
      entry.dist[value - 1] += 1
      sums.set(answer.questionId, entry)
    }
  }
  const out: Record<string, QuestionAgreement> = {}
  for (const [id, { total, dist }] of sums) {
    const count = dist.reduce((a, b) => a + b, 0)
    out[id] = { avg: Math.round(total / count), count, dist }
  }
  return out
}

/**
 * The diverging Likert palette, one colour per answer: disagreement in red,
 * the neutral middle in grey, agreement in the brand navy.
 *
 * Validated with the dataviz palette checker against the light surface:
 * CVD separation 19.5 (pass), normal-vision floor 22.0 (pass). The pale
 * steps sit under 3:1 contrast with the surface - the required relief is
 * the ring drawn around every segment, the legend above the list, and the
 * per-segment tooltip carrying the exact counts.
 */
export const LIKERT_COLORS = ['#a01414', '#e08f8f', '#e7e7ea', '#7d94c4', '#1b2d52'] as const

/**
 * How many results landed in each verdict band. The edges are the ones the
 * visitor experiences: the live pin threshold above, then the same floors
 * the results screen uses - so the statistics answer "how many saw which
 * closing message", not an arbitrary bucketing.
 */
export function bandCounts(
  percents: number[],
  threshold: number,
): [number, number, number, number] {
  const counts: [number, number, number, number] = [0, 0, 0, 0]
  for (const percent of percents) {
    if (percent >= threshold) counts[0] += 1
    else if (percent >= ANOTHER_ROUND_FLOOR) counts[1] += 1
    else if (percent >= PARTIAL_FLOOR) counts[2] += 1
    else counts[3] += 1
  }
  return counts
}

const LIKERT_LEGEND = ['כלל לא מסכים/ה', 'לא מסכים/ה', 'ניטרלי/ת', 'מסכים/ה', 'מסכים/ה מאוד']


export default function Admin() {
  // Offline mode (no Supabase configured): show baked content, block edits.
  const offline = !supabase
  const [tab, setTab] = useState<Tab>('questions')
  const [pillars, setPillars] = useState<PillarRow[]>(() => (offline ? bakedPillarRows() : []))
  const [questions, setQuestions] = useState<Question[]>(() => (offline ? BASE_QUESTIONS : []))
  const [loading, setLoading] = useState(() => !offline)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [filter, setFilter] = useState<PillarId | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [published, setPublished] = useState<{ publishedAt: string; content: Snapshot } | null>(
    null,
  )
  // What publishing would produce right now, straight from the database.
  const [draftSnapshot, setDraftSnapshot] = useState<Snapshot | null>(null)
  const [migrationMissing, setMigrationMissing] = useState(false)
  // Set when the published state could not be read for a transient reason -
  // publishing stays available, we just cannot show what is in sync.
  const [publishInfoError, setPublishInfoError] = useState(false)
  // True until migration 11 installs build_snapshot()
  const [snapshotFnMissing, setSnapshotFnMissing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  // Short-lived feedback toast (publish confirmation / pin warnings).
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)

  function showToast(text: string, tone: 'ok' | 'warn' = 'ok') {
    setToast({ text, tone })
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000)
  }
  // Creating a new statement.
  const [creating, setCreating] = useState(false)
  const [newText, setNewText] = useState('')
  const [newPillarId, setNewPillarId] = useState<PillarId | ''>('')
  const [savingNew, setSavingNew] = useState(false)
  // Every statement id that has ever been PUBLISHED. Deleting a statement
  // removes its row for good, so the live table cannot tell us which numbers
  // are retired - but the published history is append-only and can.
  const [everPublishedIds, setEverPublishedIds] = useState<Set<string>>(new Set())

  // Delete confirmation modal (browser confirm dialogs are unreliable in
  // embedded panes, so this is a real in-UI modal).
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Public agreement per statement - THE list order (Lotem: one sort, not
  // two). Loaded with everything else; if it fails, the list quietly falls
  // back to category order and the cards simply show no figures.
  const [agreement, setAgreement] = useState<Record<string, QuestionAgreement> | null>(null)
  // Every recorded total score, for the statistics tab.
  const [resultPercents, setResultPercents] = useState<number[] | null>(null)

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  // Close whichever modal is open on Escape. Not while a save is in flight,
  // so a stray keypress cannot hide a form that is still writing.
  useEffect(() => {
    if (!confirmDeleteId && !creating) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (confirmDeleteId && !deleting) setConfirmDeleteId(null)
      if (creating && !savingNew) setCreating(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmDeleteId, creating, deleting, savingNew])

  useEffect(() => {
    if (!offline) void loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadAll() {
    if (!supabase) return
    setLoading(true)
    setLoadError(false)
    const [pillarsRes, questionsRes] = await Promise.all([
      supabase.from('pillars').select('*').order('sort_order'),
      supabase.from('questions').select('*').order('sort_order'),
    ])
    if (pillarsRes.error || questionsRes.error) {
      setLoading(false)
      setLoadError(true)
      return
    }
    setPillars(
      (pillarsRes.data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        short: row.short,
        description: row.description,
        sourceUrl: row.source_url,
        // Defensive default until migration 5 adds the column.
        sources: row.sources ?? [],
        quota: row.quota,
      })),
    )
    setQuestions(
      (questionsRes.data ?? []).map((row) => ({
        id: row.id,
        pillarId: row.pillar_id,
        text: row.text,
        active: row.active,
        // Defensive default until migration 4 adds the column.
        pinned: row.pinned ?? false,
        sourceUrl: row.source_url,
        sourceLabel: row.source_label,
      })),
    )
    await Promise.all([loadPublished(), refreshDraftSnapshot(), loadEverPublishedIds(), loadAgreement()])
    setLoading(false)
  }

  async function loadPublished() {
    if (!supabase) return
    const { data, error } = await supabase
      .from('published_content')
      .select('content, published_at')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) {
      // Only a genuinely absent table means the migration was not run
      // (PGRST205 = unknown table, 42P01 = undefined_table). Anything else
      // is transient - an expired session, a hiccup - and must NOT claim a
      // missing migration or lock the publish button for the session.
      const tableMissing = error.code === 'PGRST205' || error.code === '42P01'
      setMigrationMissing(tableMissing)
      setPublishInfoError(!tableMissing)
      return
    }
    setMigrationMissing(false)
    setPublishInfoError(false)
    if (!data) {
      setPublished(null)
      return
    }
    setPublished({ publishedAt: data.published_at, content: data.content as Snapshot })
  }

  /**
   * Collect every statement id that has ever been published.
   *
   * This is what keeps a retired number from coming back. Deleting a
   * statement removes the row outright, so the questions table has no memory
   * of it - but published_content is append-only, so every id that ever went
   * live is still recorded in one of its snapshots. Failing here is not fatal:
   * we fall back to the live table, which can only ever make the next number
   * SMALLER, and the primary key would reject a genuine collision anyway.
   */
  async function loadEverPublishedIds() {
    if (!supabase) return
    const { data, error } = await supabase.from('published_content').select('content')
    if (error || !data) return
    const ids = new Set<string>()
    for (const row of data) {
      const snapshot = row.content as Snapshot
      for (const question of snapshot.questions ?? []) {
        const id = question.id
        if (typeof id === 'string') ids.add(id)
      }
    }
    setEverPublishedIds(ids)
  }

  function nextQuestionId(pillarId: PillarId): string {
    return computeNextQuestionId(
      pillarId,
      questions.map((question) => question.id),
      everPublishedIds,
    )
  }

  async function createQuestion(): Promise<boolean> {
    if (!supabase) return false
    const text = newText.trim()
    if (!text || !newPillarId) return false
    setSaveError(false)

    // Append to the end of the pool. Asking the database for the current
    // maximum rather than tracking sort_order in component state keeps the
    // two from drifting.
    const { data: last } = await supabase
      .from('questions')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const sortOrder = (last?.sort_order ?? 0) + 1

    const id = nextQuestionId(newPillarId)
    const { error } = await supabase.from('questions').insert({
      id,
      pillar_id: newPillarId,
      text,
      active: true,
      pinned: false,
      source_url: '',
      source_label: '',
      sort_order: sortOrder,
    })
    if (error) {
      setSaveError(true)
      return false
    }
    setQuestions((current) => [
      ...current,
      {
        id,
        pillarId: newPillarId,
        text,
        active: true,
        pinned: false,
        sourceUrl: '',
        sourceLabel: '',
      },
    ])
    void refreshDraftSnapshot()
    return true
  }

  async function handleCreate() {
    if (savingNew) return
    if (!newText.trim()) {
      showToast('אי אפשר לשמור היגד ריק', 'warn')
      return
    }
    if (!newPillarId) {
      showToast('צריך לבחור קטגוריה', 'warn')
      return
    }
    const pillarId = newPillarId
    setSavingNew(true)
    const created = await createQuestion()
    setSavingNew(false)
    if (!created) {
      // Same rule as editing: a failed save leaves the form open with the
      // text in it, so nothing she wrote is ever lost to a network blip.
      showToast('השמירה נכשלה - הטקסט נשמר בטופס, אפשר לנסות שוב', 'warn')
      return
    }
    const quota = pillars.find((pillar) => pillar.id === pillarId)?.quota ?? 0
    showToast(
      quota === 0
        ? 'ההיגד נוסף. שימי לב שהמכסה של הקטגוריה הזאת היא 0, אז הוא לא יישאל עד שתעלי אותה בתמהיל.'
        : 'ההיגד נוסף לטיוטה. הוא יגיע למבקרים אחרי הפרסום הבא.',
      quota === 0 ? 'warn' : 'ok',
    )
    setNewText('')
    setNewPillarId('')
    setCreating(false)
  }

  /**
   * Ask the database what publishing would produce right now. Comparing
   * that against the published snapshot is what decides whether there are
   * unpublished changes - no field list to keep in sync.
   */
  async function refreshDraftSnapshot() {
    if (!supabase) return
    const { data, error } = await supabase.rpc('build_snapshot')
    if (error) {
      // PGRST202 = the function does not exist, i.e. migration 11 has not
      // been run. Either way we cannot tell what is unpublished, so we say
      // so and leave publishing available.
      setSnapshotFnMissing(error.code === 'PGRST202')
      setPublishInfoError(true)
      return
    }
    setSnapshotFnMissing(false)
    setDraftSnapshot(data as Snapshot)
  }

  async function handlePublish() {
    if (!supabase || publishBlocked) return
    setPublishing(true)
    setSaveError(false)
    const { error } = await supabase.rpc('publish_content')
    if (error) {
      setSaveError(true)
    } else {
      await Promise.all([loadPublished(), refreshDraftSnapshot()])
      showToast('כל השינויים פורסמו ✓')
    }
    setPublishing(false)
  }

  // DB-first save: only update the screen after the database accepted the
  // change, so what you see is always what visitors get.
  /** Returns true only when the database accepted the change. Callers must
   *  not discard the admin's input on a false. */
  async function saveQuestionPatch(
    id: string,
    patch: { text?: string; active?: boolean; pinned?: boolean },
  ): Promise<boolean> {
    if (!supabase) return false
    setSaveError(false)
    const { error } = await supabase.from('questions').update(patch).eq('id', id)
    if (error) {
      setSaveError(true)
      return false
    }
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    )
    void refreshDraftSnapshot()
    return true
  }

  // Hermetic in-tab blocking (her request): impossible quota values are
  // refused with an explanation instead of saved-then-warned. The one thing
  // that cannot be blocked per-change is the SUM (any single edit passes
  // through an unbalanced state) - that is enforced at publish time.
  async function handleQuotaChange(pillar: PillarRow, requested: number) {
    const clamped = Math.max(0, Math.min(99, Math.round(requested)))
    const available = activeCount(pillar.id)
    const pinnedCount = questions.filter(
      (question) => question.pillarId === pillar.id && question.pinned,
    ).length
    if (clamped > available) {
      showToast(`אי אפשר לקבוע מכסה גבוהה ממספר ההיגדים שיש בקטגוריה ( ${available} )`, 'warn')
      return
    }
    if (clamped < pinnedCount) {
      showToast(
        pinnedCount === 1
          ? 'אי אפשר לרדת מתחת להיגד הנעוץ - בטלו את הנעיצה קודם'
          : `אי אפשר לרדת מתחת ל-${pinnedCount} ההיגדים הנעוצים - בטלו נעיצות קודם`,
        'warn',
      )
      return
    }
    await saveQuota(pillar.id, clamped)
  }

  async function saveQuota(pillarId: PillarId, quota: number) {
    if (!supabase) return
    setSaveError(false)
    const clamped = Math.max(0, Math.min(99, Math.round(quota)))
    const { error } = await supabase.from('pillars').update({ quota: clamped }).eq('id', pillarId)
    if (error) {
      setSaveError(true)
      return
    }
    setPillars((current) =>
      current.map((pillar) => (pillar.id === pillarId ? { ...pillar, quota: clamped } : pillar)),
    )
    void refreshDraftSnapshot()
  }

  function startEdit(question: Question) {
    setEditingId(question.id)
    setDraft(question.text)
  }

  async function handleTogglePin(question: Question) {
    // Pinning beyond the pillar's quota would be an impossible promise -
    // block it up front (edge case 1). The reverse hole (quota lowered
    // after pinning) is warned about in the mix tab and kept safe by the
    // selection engine (quota always wins).
    if (!question.pinned) {
      const quota = pillars.find((pillar) => pillar.id === question.pillarId)?.quota ?? 0
      const pinnedCount = questions.filter(
        (item) => item.pillarId === question.pillarId && item.pinned,
      ).length
      if (pinnedCount + 1 > quota) {
        showToast(
          quota === 1
            ? 'אי אפשר לנעוץ יותר מהיגד אחד בקטגוריה הזאת - זו המכסה שלה בתמהיל'
            : `אי אפשר לנעוץ יותר מ-${quota} היגדים בקטגוריה הזאת - זו המכסה שלה בתמהיל`,
          'warn',
        )
        return
      }
    }
    await saveQuestionPatch(question.id, { pinned: !question.pinned })
  }

  async function handleDeleteConfirmed() {
    if (!supabase || !confirmDeleteId) return
    setDeleting(true)
    setSaveError(false)
    const { error } = await supabase.from('questions').delete().eq('id', confirmDeleteId)
    setDeleting(false)
    if (error) {
      setSaveError(true)
      setConfirmDeleteId(null)
      return
    }
    setQuestions((current) => current.filter((question) => question.id !== confirmDeleteId))
    setConfirmDeleteId(null)
    void refreshDraftSnapshot()
  }

  async function saveEdit() {
    if (!editingId) return
    if (draft.trim().length === 0) {
      showToast('אי אפשר לשמור היגד ריק', 'warn')
      return
    }
    const saved = await saveQuestionPatch(editingId, { text: draft.trim() })
    // Close only on success - otherwise the editor stays open with the
    // typed text, so a failed save can never lose the admin's writing.
    if (saved) {
      setEditingId(null)
    } else {
      showToast('השמירה נכשלה - הטקסט נשמר בעורך, אפשר לנסות שוב', 'warn')
    }
  }

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut()
  }

  async function loadAgreement() {
    if (!supabase) return
    const { data, error } = await supabase.from('results').select('answers,total_percent')
    if (error || !data) return
    setAgreement(aggregateAgreement(data))
    setResultPercents(data.map((row) => Number(row.total_percent)).filter(Number.isFinite))
  }

  // One order: by public agreement, highest first. The stable sort on top
  // of the category grouping means statements nobody has answered yet sink
  // to the end in category order rather than scrambling.
  const categoryOrdered = orderByCategory(
    questions,
    pillars.map((pillar) => pillar.id),
  )
  const sorted = agreement
    ? [...categoryOrdered].sort(
        (a, b) => (agreement[b.id]?.avg ?? -1) - (agreement[a.id]?.avg ?? -1),
      )
    : categoryOrdered
  const visibleQuestions = filter === 'all' ? sorted : sorted.filter((q) => q.pillarId === filter)
  const quotaSum = pillars.reduce((sum, pillar) => sum + pillar.quota, 0)
  const activeCount = (pillarId: PillarId) =>
    questions.filter((q) => q.pillarId === pillarId && q.active).length
  // Unpublished changes = the snapshot publishing would produce right now
  // differs from the one that is live. Asking the database rather than
  // reproducing its rules here is what keeps this from missing a field.
  const dirty =
    !offline &&
    !migrationMissing &&
    // If either side is unknown, allow publishing rather than locking her
    // out on a transient read failure.
    (publishInfoError ||
      published === null ||
      draftSnapshot === null ||
      canonical(draftSnapshot) !== canonical(published.content))

  // The quiz length is simply what the mix yields, so there is nothing to
  // validate it against - any mix is publishable. The single exception is an
  // empty quiz, which would leave visitors with nothing to answer.
  const publishBlocked = !offline && !loading && quotaSum === 0

  // Spell out WHAT is unpublished, so a difference that arrived through a
  // database migration is legible rather than mysterious.
  const changeSummary =
    dirty && published && draftSnapshot ? summarizeDiff(draftSnapshot, published.content) : []

  const pinnedVisible = visibleQuestions.filter((question) => question.pinned)
  const restVisible = visibleQuestions.filter((question) => !question.pinned)

  function renderQuestionCard(question: Question) {
    const pillar = pillars.find((p) => p.id === question.pillarId)
    const isEditing = editingId === question.id
    return (
      <div
        key={question.id}
        className={
          'rounded-xl border bg-white p-4 shadow-sm ' +
          (question.pinned ? 'border-navy/30 ' : 'border-line ') +
          (question.active ? '' : 'opacity-60')
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Same category colour as the filter pills and the mix donut */}
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-cream px-2.5 py-0.5 font-medium text-navy">
            {pillar && (
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: categoryColor(question.pillarId) }}
              />
            )}
            {pillar?.short}
          </span>
          {agreement && (
            <span className="rounded-full border border-line px-2.5 py-0.5 tabular-nums text-muted">
              {agreement[question.id]
                ? `הסכמה ${agreement[question.id].avg}% · ${agreement[question.id].count} תשובות`
                : 'עוד לא נענה'}
            </span>
          )}
          {!question.active && (
            <span className="rounded-full bg-red-600/10 px-2.5 py-0.5 font-medium text-red-600">
              כבויה
            </span>
          )}
          <span className="grow" />
          {!offline && !isEditing && (
            <span className="flex items-center gap-1">
              {/* The icon shows the action the button performs, not the
                  current state - the section grouping carries the state. */}
              <IconButton
                label={
                  question.pinned
                    ? 'ביטול נעיצה - ההיגד יחזור להגרלה הרגילה'
                    : 'נעיצה - ההיגד ייכלל בכל שאלון, בלי הגרלה'
                }
                onClick={() => void handleTogglePin(question)}
              >
                {question.pinned ? <PinOffIcon /> : <PinIcon />}
              </IconButton>
              <IconButton label="עריכת נוסח ההיגד" onClick={() => startEdit(question)}>
                <EditIcon />
              </IconButton>
              <IconButton
                label="מחיקת ההיגד מהמאגר"
                tone="danger"
                onClick={() => setConfirmDeleteId(question.id)}
              >
                <TrashIcon />
              </IconButton>
            </span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-3">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-line p-3 text-sm leading-relaxed focus:border-navy focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void saveEdit()}
                className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-navy-dark"
              >
                שמירה
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="rounded-lg border border-line px-4 py-1.5 text-sm text-muted hover:border-navy hover:text-navy"
              >
                ביטול
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-relaxed">{question.text}</p>
        )}

        {/* The answer distribution: a five-segment stacked bar, disagreement
            on the reading side. Width is share of answers; the 2px gaps and
            the inset ring keep the pale segments bounded, and each segment's
            tooltip carries its exact count. */}
        {agreement && agreement[question.id] && !isEditing && (
          <div
            className="mt-3 flex h-2 w-full gap-[2px]"
            role="img"
            aria-label={LIKERT_LEGEND.map(
              (label, index) => `${label}: ${agreement[question.id].dist[index]}`,
            ).join(', ')}
          >
            {agreement[question.id].dist.map((count, index) =>
              count === 0 ? null : (
                <div
                  key={index}
                  className="h-full rounded-[3px] ring-1 ring-inset ring-black/10"
                  title={`${LIKERT_LEGEND[index]}: ${count} מתוך ${agreement[question.id].count}`}
                  style={{
                    backgroundColor: LIKERT_COLORS[index],
                    flexGrow: count,
                    flexBasis: 0,
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <>
        <Header onSignOut={offline ? undefined : () => void handleSignOut()} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-muted">טוען את המאגר...</main>
      </>
    )
  }

  if (loadError) {
    return (
      <>
        <Header onSignOut={offline ? undefined : () => void handleSignOut()} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-muted">לא הצלחתי לטעון את המאגר מהמסד.</p>
          <button
            type="button"
            onClick={() => void loadAll()}
            className="mt-4 rounded-lg border border-navy px-6 py-2 font-medium text-navy hover:bg-navy hover:text-white"
          >
            ניסיון נוסף
          </button>
        </main>
      </>
    )
  }

  return (
    <>
      <Header onSignOut={offline ? undefined : () => void handleSignOut()} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-navy">
            שאלון התאמה לאל הדגל - ממשק ניהול
          </h1>
          <div className="flex gap-2">
            {!offline && (
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={!dirty || publishing || migrationMissing || publishBlocked}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {publishing ? 'מפרסם...' : 'פרסום לשאלון החי'}
              </button>
            )}
          </div>
        </div>

        {offline && (
          <p className="mt-3 rounded-lg border border-line bg-white p-3 text-xs leading-relaxed text-muted">
            אין חיבור למסד הנתונים - מוצג התוכן המובנה לקריאה בלבד.
          </p>
        )}
        {migrationMissing && (
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-700">
            מנגנון הפרסום עוד לא הותקן במסד - יש להריץ את supabase/migration-2-publish.sql
            ב-SQL Editor.
          </p>
        )}
        {!offline && !migrationMissing && publishInfoError && (
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-600">
            {snapshotFnMissing
              ? 'כדי לזהות מה טרם פורסם יש להריץ את supabase/migration-11-publish-plumbing.sql. אפשר לפרסם בכל מקרה.'
              : 'לא הצלחתי לבדוק מה כבר פורסם. אפשר לפרסם בכל מקרה.'}
            <button
              type="button"
              onClick={() => void Promise.all([loadPublished(), refreshDraftSnapshot()])}
              className="underline underline-offset-2 hover:text-navy"
            >
              ניסיון נוסף
            </button>
          </p>
        )}
        {!offline && !migrationMissing && !publishInfoError && (
          <p className={'mt-2 text-xs ' + (dirty ? 'font-medium text-amber-600' : 'text-muted')}>
            {dirty
              ? changeSummary.length > 0
                ? 'שינויים שעדיין לא פורסמו: ' + changeSummary.join(' · ')
                : 'יש שינויים שעדיין לא פורסמו'
              : published
                ? 'פרסום אחרון: ' + formatPublishedAt(published.publishedAt)
                : 'עדיין לא פורסמה גרסה ראשונה'}
          </p>
        )}
        {!offline && !migrationMissing && publishBlocked && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-600/5 p-3 text-xs leading-relaxed text-red-600">
            אי אפשר לפרסם שאלון ריק - יש לקבוע לפחות היגד אחד באחת הקטגוריות.
          </p>
        )}
        {saveError && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-600/5 p-3 text-xs text-red-600">
            השמירה האחרונה נכשלה - בדקו את החיבור ונסו שוב.
          </p>
        )}

        {/* Tabs: underlined so they read as navigation between sections,
            clearly apart from the pill-shaped filters inside a section. */}
        <div role="tablist" className="mt-6 flex gap-6 border-b border-line">
          <TabButton
            active={tab === 'questions'}
            onClick={() => setTab('questions')}
            count={questions.length}
          >
            ניהול מאגר ההיגדים
          </TabButton>
          <TabButton active={tab === 'mix'} onClick={() => setTab('mix')} count={quotaSum}>
            ניהול אורך ותמהיל השאלון
          </TabButton>
          <TabButton
            active={tab === 'stats'}
            onClick={() => setTab('stats')}
            count={resultPercents?.length ?? 0}
          >
            סטטיסטיקות
          </TabButton>
        </div>

        {tab === 'questions' && (
          <section className="mt-5">
            {/* Filters on one side, the one action on the other. The chips
                wrap among themselves without ever pushing the button away. */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                  הכול ({questions.length})
                </FilterChip>
                {pillars.map((pillar) => (
                  <FilterChip
                    key={pillar.id}
                    active={filter === pillar.id}
                    color={categoryColor(pillar.id)}
                    onClick={() => setFilter(pillar.id)}
                  >
                    {pillar.short} ({questions.filter((q) => q.pillarId === pillar.id).length})
                  </FilterChip>
                ))}
              </div>
              {!offline && (
                <button
                  type="button"
                  onClick={() => {
                    // A filtered category is almost certainly the one she
                    // means, so it starts selected.
                    setNewPillarId(filter === 'all' ? '' : filter)
                    setNewText('')
                    setCreating(true)
                  }}
                  className="shrink-0 rounded-lg border border-navy px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-navy hover:text-white"
                >
                  היגד חדש
                </button>
              )}
            </div>

            {agreement && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                {LIKERT_LEGEND.map((item, index) => (
                  <span key={item} className="flex items-center gap-1">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-inset ring-black/10"
                      style={{ backgroundColor: LIKERT_COLORS[index] }}
                    />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Pinned questions lead the list, under their own explanation */}
            {pinnedVisible.length > 0 && (
              <div className="mt-5">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-navy">
                  <span className="text-navy">
                    <PinIcon filled />
                  </span>
                  היגדים נעוצים ({pinnedVisible.length})
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  היגד נעוץ נכלל בכל שאלון ואינו תלוי בהגרלה. מיקומו בתוך השאלון עדיין
                  אקראי, והוא תופס מקום מתוך המכסה של הקטגוריה שלו.
                </p>
                <div className="mt-3 space-y-3">{pinnedVisible.map(renderQuestionCard)}</div>
              </div>
            )}

            <div className={pinnedVisible.length > 0 ? 'mt-6' : 'mt-4'}>
              {pinnedVisible.length > 0 && (
                <h2 className="mb-3 text-sm font-bold text-navy">
                  שאר המאגר ({restVisible.length})
                </h2>
              )}
              <div className="space-y-3">{restVisible.map(renderQuestionCard)}</div>
            </div>
          </section>
        )}

        {tab === 'mix' && (
          <section className="mt-5">
            <MixChart slices={pillarSlices(pillars)} />
            <div className="mt-4 space-y-3">
              {pillars.map((pillar) => {
                const available = activeCount(pillar.id)
                const pinnedInPillar = questions.filter(
                  (question) => question.pillarId === pillar.id && question.pinned,
                ).length
                return (
                  <div
                    key={pillar.id}
                    // items-start: the quota control sits at the TOP of the
                    // card, level with the category name, instead of floating
                    // in the middle of a tall block of text.
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        {/* Same colour the donut above uses for this category */}
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: categoryColor(pillar.id) }}
                        />
                        {pillar.title}
                      </p>
                      {/* What this category's questions are about */}
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {pillar.description}
                      </p>
                      {/* The material the questions must rest on */}
                      {pillar.sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-bold text-navy">
                            ההיגדים צריכים להתבסס על המקורות הבאים:
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {pillar.sources.map((source) => (
                              <li key={source.url} className="text-xs">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-navy underline underline-offset-2 hover:text-navy-dark"
                                >
                                  {source.label} ↗
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {/* The quota control, and directly under it the notes that
                        belong to it: how many statements are pinned here, and
                        anything that makes this number impossible. */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {/* dir="ltr" so it always reads "quota / total" like a fraction */}
                      <div dir="ltr" className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={pinnedInPillar}
                        max={available}
                        value={pillar.quota}
                        disabled={offline}
                        onChange={(event) =>
                          void handleQuotaChange(pillar, Number.parseInt(event.target.value, 10) || 0)
                        }
                        className="w-14 rounded-lg border border-line p-2 text-center tabular-nums focus:border-navy focus:outline-none"
                        aria-label={`מספר היגדים בשאלון: ${pillar.title}`}
                      />
                      <span className="text-lg font-bold text-muted">/</span>
                      {/* The pillar's full pool size - controlled in the questions tab */}
                      <span
                        title="סך ההיגדים בקטגוריה - נקבע בטאב ניהול מאגר ההיגדים"
                        className="w-8 text-center text-lg font-semibold tabular-nums text-muted/60"
                      >
                        {available}
                      </span>
                      </div>

                      {/* Notes that explain or constrain the number above */}
                      {pinnedInPillar > 0 && (
                        <p className="text-xs text-muted">
                          {pinnedInPillar === 1 ? 'היגד אחד נעוץ' : `${pinnedInPillar} היגדים נעוצים`}
                        </p>
                      )}
                      {pillar.quota > available && (
                        <p className="max-w-40 text-end text-xs font-medium text-red-600">
                          אין מספיק היגדים במאגר לקטגוריה הזאת
                        </p>
                      )}
                      {pinnedInPillar > pillar.quota && (
                        <p className="max-w-40 text-end text-xs font-medium text-red-600">
                          יש יותר היגדים נעוצים מהמכסה - רק חלקם ייכנסו לכל שאלון
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {tab === 'stats' && (
          <section className="mt-5">
            {resultPercents === null ? (
              <p className="text-sm text-muted">לא הצלחתי לטעון את התוצאות. רעננו את העמוד.</p>
            ) : resultPercents.length === 0 ? (
              <p className="text-sm text-muted">
                עוד אין תוצאות - השאלונים הראשונים שימולאו יופיעו כאן.
              </p>
            ) : (
              (() => {
                const liveThreshold =
                  Number(
                    (published?.content.config as Record<string, unknown> | undefined)?.[
                      'pin_flag_threshold'
                    ],
                  ) || PIN_FLAG_THRESHOLD
                const counts = bandCounts(resultPercents, liveThreshold)
                const total = resultPercents.length
                const mean = Math.round(
                  resultPercents.reduce((a, b) => a + b, 0) / total,
                )
                const sortedPercents = [...resultPercents].sort((a, b) => a - b)
                const median = sortedPercents[Math.floor((total - 1) / 2)]
                const bands = [
                  { label: 'הדגל הזה גם שלכם', range: `${liveThreshold}% ומעלה`, tone: 'bg-navy' },
                  { label: 'אנחנו מחזיקים בדעות קרובות מאוד', range: `${ANOTHER_ROUND_FLOOR}-${liveThreshold - 1}%`, tone: 'bg-navy/70' },
                  { label: 'יש בינינו הרבה מן המשותף', range: `${PARTIAL_FLOOR}-${ANOTHER_ROUND_FLOOR - 1}%`, tone: 'bg-navy/45' },
                  { label: 'נסכים שלא להסכים', range: `עד ${PARTIAL_FLOOR - 1}%`, tone: 'bg-navy/25' },
                ]
                const max = Math.max(...counts, 1)
                return (
                  <>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-navy/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy ring-1 ring-navy/10">
                        {total} שאלונים מולאו
                      </span>
                      <span className="rounded-full bg-navy/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy ring-1 ring-navy/10">
                        ממוצע {mean}%
                      </span>
                      <span className="rounded-full bg-navy/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy ring-1 ring-navy/10">
                        חציון {median}%
                      </span>
                    </div>

                    {/* One bar per closing message, in the visitor's own
                        words - "how many saw which verdict". Bars scale to
                        the largest band; the count and share are written
                        out, so nothing rests on length alone. */}
                    <div className="mt-4 rounded-xl border border-line bg-white p-5 shadow-sm">
                      <div className="divide-y divide-line">
                        {bands.map((band, index) => (
                          <div key={band.label} className="py-3">
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <span className="font-medium text-navy">
                                {band.label}
                                <span className="ms-2 text-xs font-normal text-muted">{band.range}</span>
                              </span>
                              <span className="shrink-0 tabular-nums text-muted">
                                {counts[index]} · {Math.round((counts[index] / total) * 100)}%
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                              <div
                                className={`h-full rounded-full ${band.tone}`}
                                style={{ width: `${(counts[index] / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()
            )}
          </section>
        )}
      </main>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-30 flex justify-center px-6">
          <div
            className={
              'toast-pop rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-lg ' +
              (toast.tone === 'warn' ? 'bg-amber-600' : 'bg-navy-dark')
            }
          >
            {toast.text}
          </div>
        </div>
      )}

      {creating && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-navy-dark/40 px-6"
          onClick={() => !savingNew && setCreating(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="היגד חדש"
            className="toast-pop w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-bold text-navy">היגד חדש</h2>
            <label className="mt-4 block text-xs font-medium text-muted" htmlFor="new-text">
              נוסח ההיגד
            </label>
            <textarea
              id="new-text"
              value={newText}
              onChange={(event) => setNewText(event.target.value)}
              rows={4}
              autoFocus
              className="mt-1 w-full rounded-lg border border-line p-3 text-sm leading-relaxed focus:border-navy focus:outline-none"
              placeholder="מה המבקרים ידרגו מ-1 עד 5"
            />
            <label className="mt-3 block text-xs font-medium text-muted" htmlFor="new-pillar">
              קטגוריה
            </label>
            <select
              id="new-pillar"
              value={newPillarId}
              onChange={(event) => setNewPillarId(event.target.value as PillarId | '')}
              className="mt-1 w-full rounded-lg border border-line bg-white p-2.5 text-sm focus:border-navy focus:outline-none"
            >
              <option value="">בחרי קטגוריה</option>
              {pillars.map((pillar) => (
                <option key={pillar.id} value={pillar.id}>
                  {pillar.short}
                </option>
              ))}
            </select>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={savingNew || !newText.trim() || !newPillarId}
                className="rounded-lg bg-navy px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingNew ? 'שומרת...' : 'הוספה למאגר'}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                disabled={savingNew}
                className="rounded-lg border border-line px-5 py-2 text-sm font-medium text-muted transition-colors hover:border-navy hover:text-navy disabled:opacity-40"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-navy-dark/40 px-6"
          onClick={() => setConfirmDeleteId(null)}
        >
          {/* Clicks inside the card must not close the modal */}
          <div
            role="dialog"
            aria-modal="true"
            className="toast-pop w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-bold text-navy">למחוק את ההיגד?</h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
              ״{questions.find((question) => question.id === confirmDeleteId)?.text}״
            </p>
            <p className="mt-2 text-xs text-muted">
              המחיקה תיכנס לתוקף אצל המבקרים רק אחרי הפרסום הבא.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => void handleDeleteConfirmed()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'מוחקת...' : 'מחיקה'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="rounded-lg border border-line px-5 py-2 text-sm font-medium text-muted transition-colors hover:border-navy hover:text-navy"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function TabButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      // -mb-px lets the active underline sit ON the row's hairline
      className={
        '-mb-px flex items-center gap-2 border-b-2 pb-2.5 text-sm transition-colors ' +
        (active
          ? 'border-navy font-bold text-navy'
          : 'border-transparent font-medium text-muted hover:border-line hover:text-navy')
      }
    >
      {children}
      <span
        className={
          'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ' +
          (active ? 'bg-navy text-white' : 'bg-line/70 text-muted')
        }
      >
        {count}
      </span>
    </button>
  )
}

/**
 * A category filter pill. It carries the category's colour as a dot, and
 * when selected tints its background and border with the same hue - the
 * text stays in ink so the lighter hues remain readable, and the name is
 * always present, so colour is never the only signal.
 */
function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  /** Category hue; omitted for the "all" pill, which stays neutral navy */
  color?: string
  children: ReactNode
}) {
  const neutral = active
    ? 'bg-navy text-white'
    : 'border border-line bg-white text-muted hover:border-navy hover:text-navy'

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
        (color ? 'border ' + (active ? 'text-navy' : 'text-muted hover:text-navy') : neutral)
      }
      style={
        color
          ? {
              borderColor: active ? color : 'var(--color-line)',
              backgroundColor: active ? color + '1f' : '#fff',
            }
          : undefined
      }
    >
      {color && (
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  )
}
