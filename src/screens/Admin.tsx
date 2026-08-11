// Admin.tsx - the backoffice, now backed by Supabase.
// Every edit here writes straight to the database and reaches all visitors
// immediately - no rebuild, no redeploy. Access is enforced by AuthGate +
// Row Level Security (only an authenticated session may write).
// Without a configured Supabase connection the screen falls back to a
// read-only view of the baked-in content.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Header from '../components/Header'
import IconButton, { EditIcon, PinIcon, TrashIcon } from '../components/IconButton'
import MixChart, { pillarSlices } from '../components/MixChart'
import { PILLARS as BAKED_PILLARS } from '../content/pillars'
import { BASE_QUESTIONS } from '../content/questions'
import { DEFAULT_QUOTAS } from '../content/quizConfig'
import type { Pillar, PillarId, Question } from '../content/types'
import { supabase } from '../lib/supabaseClient'

interface PillarRow extends Pillar {
  quota: number
}

/** The latest published snapshot, reduced to the fields the admin can edit -
 *  used to decide whether there are unpublished changes. */
interface PublishedSnapshot {
  publishedAt: string
  questionState: Map<string, { text: string; active: boolean; pinned: boolean }>
  /** Everything publish_content() snapshots per pillar, so the dirty check
   *  cannot miss a field (quota, description, sources). */
  pillarState: Map<string, { quota: number; description: string; sources: string }>
}

/** Stable string form of a pillar's editable fields, for change detection */
function pillarFingerprint(pillar: {
  quota: number
  description: string
  sources: unknown
}): { quota: number; description: string; sources: string } {
  return {
    quota: pillar.quota,
    description: pillar.description ?? '',
    sources: JSON.stringify(pillar.sources ?? []),
  }
}

function formatPublishedAt(iso: string): string {
  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

type Tab = 'questions' | 'mix'

function bakedPillarRows(): PillarRow[] {
  return BAKED_PILLARS.map((pillar) => ({ ...pillar, quota: DEFAULT_QUOTAS[pillar.id] }))
}

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
  const [published, setPublished] = useState<PublishedSnapshot | null>(null)
  const [migrationMissing, setMigrationMissing] = useState(false)
  // Set when the published state could not be read for a transient reason -
  // publishing stays available, we just cannot show what is in sync.
  const [publishInfoError, setPublishInfoError] = useState(false)
  const [publishing, setPublishing] = useState(false)
  // Short-lived feedback toast (publish confirmation / pin warnings).
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null)
  const toastTimerRef = useRef<number | undefined>(undefined)

  function showToast(text: string, tone: 'ok' | 'warn' = 'ok') {
    setToast({ text, tone })
    window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000)
  }
  // Delete confirmation modal (browser confirm dialogs are unreliable in
  // embedded panes, so this is a real in-UI modal).
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => () => window.clearTimeout(toastTimerRef.current), [])

  // Close the modal on Escape while it is open.
  useEffect(() => {
    if (!confirmDeleteId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmDeleteId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirmDeleteId])

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
    await loadPublished()
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
    const content = data.content as {
      pillars?: Array<Record<string, unknown>>
      questions?: Array<Record<string, unknown>>
    }
    setPublished({
      publishedAt: data.published_at,
      questionState: new Map(
        (content.questions ?? []).map((q) => [
          q.id as string,
          {
            text: q.text as string,
            active: q.active as boolean,
            // Snapshots published before the pinned feature lack this field.
            pinned: (q.pinned as boolean | undefined) ?? false,
          },
        ]),
      ),
      pillarState: new Map(
        (content.pillars ?? []).map((p) => [
          p.id as string,
          pillarFingerprint({
            quota: p.quota as number,
            description: p.description as string,
            sources: p.sources,
          }),
        ]),
      ),
    })
  }

  async function handlePublish() {
    if (!supabase || publishBlocked) return
    setPublishing(true)
    setSaveError(false)
    const { error } = await supabase.rpc('publish_content')
    if (error) {
      setSaveError(true)
    } else {
      await loadPublished()
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
      showToast(`אי אפשר לקבוע מכסה גבוהה ממספר השאלות שיש בפילר ( ${available} )`, 'warn')
      return
    }
    if (clamped < pinnedCount) {
      showToast(
        pinnedCount === 1
          ? 'אי אפשר לרדת מתחת לשאלה הנעוצה - בטלו את הנעיצה קודם'
          : `אי אפשר לרדת מתחת ל-${pinnedCount} השאלות הנעוצות - בטלו נעיצות קודם`,
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
            ? 'אי אפשר לנעוץ יותר משאלה אחת בפילר הזה - זו המכסה שלו בתמהיל'
            : `אי אפשר לנעוץ יותר מ-${quota} שאלות בפילר הזה - זו המכסה שלו בתמהיל`,
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
  }

  async function saveEdit() {
    if (!editingId) return
    if (draft.trim().length === 0) {
      showToast('אי אפשר לשמור שאלה ריקה', 'warn')
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

  const visibleQuestions = filter === 'all' ? questions : questions.filter((q) => q.pillarId === filter)
  const quotaSum = pillars.reduce((sum, pillar) => sum + pillar.quota, 0)
  const activeCount = (pillarId: PillarId) =>
    questions.filter((q) => q.pillarId === pillarId && q.active).length
  // Unpublished changes exist when any editable field differs from the
  // latest published snapshot (or when nothing was ever published).
  const dirty =
    !offline &&
    !migrationMissing &&
    // If the published state is unknown, allow publishing rather than
    // locking her out on a transient read failure.
    (publishInfoError ||
      published === null ||
      questions.length !== published.questionState.size ||
      questions.some((question) => {
        const snap = published.questionState.get(question.id)
        return (
          !snap ||
          snap.text !== question.text ||
          snap.active !== question.active ||
          snap.pinned !== question.pinned
        )
      }) ||
      pillars.length !== published.pillarState.size ||
      pillars.some((pillar) => {
        const snap = published.pillarState.get(pillar.id)
        const now = pillarFingerprint(pillar)
        return (
          !snap ||
          snap.quota !== now.quota ||
          snap.description !== now.description ||
          snap.sources !== now.sources
        )
      }))
  // The quiz length is simply what the mix yields, so there is nothing to
  // validate it against - any mix is publishable. The single exception is an
  // empty quiz, which would leave visitors with nothing to answer.
  const publishBlocked = !offline && !loading && quotaSum === 0
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
          <span className="rounded-full border border-line bg-cream px-2.5 py-0.5 font-medium text-navy">
            {pillar?.short}
          </span>
          {!question.active && (
            <span className="rounded-full bg-red-600/10 px-2.5 py-0.5 font-medium text-red-600">
              כבויה
            </span>
          )}
          <span className="grow" />
          {!offline && !isEditing && (
            <span className="flex items-center gap-1">
              <IconButton
                label={
                  question.pinned
                    ? 'ביטול נעיצה - השאלה תחזור להגרלה הרגילה'
                    : 'נעיצה - השאלה תיכלל בכל שאלון, בלי הגרלה'
                }
                tone={question.pinned ? 'active' : 'default'}
                onClick={() => void handleTogglePin(question)}
              >
                <PinIcon filled={question.pinned} />
              </IconButton>
              <IconButton label="עריכת נוסח השאלה" onClick={() => startEdit(question)}>
                <EditIcon />
              </IconButton>
              <IconButton
                label="מחיקת השאלה מהמאגר"
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
            לא הצלחתי לבדוק מה כבר פורסם. אפשר לפרסם בכל מקרה.
            <button
              type="button"
              onClick={() => void loadPublished()}
              className="underline underline-offset-2 hover:text-navy"
            >
              ניסיון נוסף
            </button>
          </p>
        )}
        {!offline && !migrationMissing && !publishInfoError && (
          <p className={'mt-2 text-xs ' + (dirty ? 'font-medium text-amber-600' : 'text-muted')}>
            {dirty
              ? 'יש שינויים שעדיין לא פורסמו'
              : published
                ? 'פרסום אחרון: ' + formatPublishedAt(published.publishedAt)
                : 'עדיין לא פורסמה גרסה ראשונה'}
          </p>
        )}
        {!offline && !migrationMissing && publishBlocked && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-600/5 p-3 text-xs leading-relaxed text-red-600">
            אי אפשר לפרסם שאלון ריק - יש לקבוע לפחות שאלה אחת באחד הפילרים.
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
            ניהול מאגר השאלות
          </TabButton>
          <TabButton active={tab === 'mix'} onClick={() => setTab('mix')} count={quotaSum}>
            ניהול אורך ותמהיל השאלון
          </TabButton>
        </div>

        {tab === 'questions' && (
          <section className="mt-5">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                הכול ({questions.length})
              </FilterChip>
              {pillars.map((pillar) => (
                <FilterChip
                  key={pillar.id}
                  active={filter === pillar.id}
                  onClick={() => setFilter(pillar.id)}
                >
                  {pillar.short} ({questions.filter((q) => q.pillarId === pillar.id).length})
                </FilterChip>
              ))}
            </div>

            {/* Pinned questions lead the list, under their own explanation */}
            {pinnedVisible.length > 0 && (
              <div className="mt-5">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-navy">
                  <span className="text-navy">
                    <PinIcon filled />
                  </span>
                  שאלות נעוצות ({pinnedVisible.length})
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  שאלה נעוצה נכללת בכל שאלון ואינה תלויה בהגרלה. מיקומה בתוך השאלון עדיין
                  אקראי, והיא תופסת מקום מתוך המכסה של הפילר שלה.
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
                    className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{pillar.title}</p>
                      {/* One line: what this pillar measures */}
                      <p className="mt-0.5 text-xs text-muted">{pillar.description}</p>
                      {/* The material the questions rely on */}
                      {pillar.sources.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                          {pillar.sources.map((source) => (
                            <a
                              key={source.url}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-navy underline underline-offset-2 hover:text-navy-dark"
                            >
                              {source.label} ↗
                            </a>
                          ))}
                        </p>
                      )}
                      {pinnedInPillar > 0 && (
                        <p className="mt-1 text-xs text-muted">
                          {pinnedInPillar === 1 ? 'נעוצה אחת' : `${pinnedInPillar} נעוצות`}
                        </p>
                      )}
                      {pillar.quota > available && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          אין מספיק שאלות במאגר לפילר הזה
                        </p>
                      )}
                      {pinnedInPillar > pillar.quota && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          יש יותר שאלות נעוצות מהמכסה - רק חלק מהנעוצות ייכנסו לכל שאלון
                        </p>
                      )}
                    </div>
                    {/* dir="ltr" so it always reads "quota / total" like a fraction */}
                    <div dir="ltr" className="flex shrink-0 items-center gap-1.5">
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
                        aria-label={`מספר שאלות בשאלון: ${pillar.title}`}
                      />
                      <span className="text-lg font-bold text-muted">/</span>
                      {/* The pillar's full pool size - controlled in the questions tab */}
                      <span
                        title="סך השאלות בפילר - נקבע בטאב ניהול מאגר השאלות"
                        className="w-8 text-center text-lg font-semibold tabular-nums text-muted/60"
                      >
                        {available}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
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
            <h2 className="font-bold text-navy">למחוק את השאלה?</h2>
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
        (active
          ? 'bg-navy text-white'
          : 'border border-line bg-white text-muted hover:border-navy hover:text-navy')
      }
    >
      {children}
    </button>
  )
}
