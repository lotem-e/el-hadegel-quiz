// Admin.tsx - the backoffice, now backed by Supabase.
// Every edit here writes straight to the database and reaches all visitors
// immediately - no rebuild, no redeploy. Access is enforced by AuthGate +
// Row Level Security (only an authenticated session may write).
// Without a configured Supabase connection the screen falls back to a
// read-only view of the baked-in content.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Header from '../components/Header'
import { PILLARS as BAKED_PILLARS } from '../content/pillars'
import { BASE_QUESTIONS } from '../content/questions'
import { DEFAULT_QUOTAS, QUIZ_LENGTH } from '../content/quizConfig'
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
  quotaState: Map<string, number>
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
  const [quizLength, setQuizLength] = useState(QUIZ_LENGTH)
  const [loading, setLoading] = useState(() => !offline)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [filter, setFilter] = useState<PillarId | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [published, setPublished] = useState<PublishedSnapshot | null>(null)
  const [migrationMissing, setMigrationMissing] = useState(false)
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
    const [pillarsRes, questionsRes, configRes] = await Promise.all([
      supabase.from('pillars').select('*').order('sort_order'),
      supabase.from('questions').select('*').order('sort_order'),
      supabase.from('quiz_config').select('*').limit(1).single(),
    ])
    if (pillarsRes.error || questionsRes.error || configRes.error) {
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
    setQuizLength(configRes.data.quiz_length)
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
      // Table missing = the publish migration was not run yet.
      setMigrationMissing(true)
      return
    }
    setMigrationMissing(false)
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
      quotaState: new Map((content.pillars ?? []).map((p) => [p.id as string, p.quota as number])),
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
  async function saveQuestionPatch(
    id: string,
    patch: { text?: string; active?: boolean; pinned?: boolean },
  ) {
    if (!supabase) return
    setSaveError(false)
    const { error } = await supabase.from('questions').update(patch).eq('id', id)
    if (error) {
      setSaveError(true)
      return
    }
    setQuestions((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    )
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
    if (editingId && draft.trim().length > 0) {
      await saveQuestionPatch(editingId, { text: draft.trim() })
    }
    setEditingId(null)
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
    (published === null ||
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
      pillars.some((pillar) => published.quotaState.get(pillar.id) !== pillar.quota))
  // The publish gate: a broken mix may exist in the draft (editing passes
  // through unbalanced states) but must never reach visitors.
  const mixProblems: string[] = []
  if (!offline && !loading) {
    if (quotaSum !== quizLength) {
      mixProblems.push(`סכום התמהיל הוא ${quotaSum} במקום ${quizLength}`)
    }
    for (const pillar of pillars) {
      if (pillar.quota > activeCount(pillar.id)) {
        mixProblems.push(`בפילר ״${pillar.short}״ המכסה גבוהה ממספר השאלות שנותרו במאגר`)
      }
      const pinnedCount = questions.filter(
        (question) => question.pillarId === pillar.id && question.pinned,
      ).length
      if (pinnedCount > pillar.quota) {
        mixProblems.push(`בפילר ״${pillar.short}״ יש יותר שאלות נעוצות מהמכסה`)
      }
    }
  }
  const publishBlocked = mixProblems.length > 0

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
        {!offline && !migrationMissing && (
          <p className={'mt-2 text-xs ' + (dirty ? 'font-medium text-amber-600' : 'text-muted')}>
            {dirty
              ? 'יש שינויים שעדיין לא פורסמו'
              : published
                ? 'פרסום אחרון: ' + formatPublishedAt(published.publishedAt)
                : 'עדיין לא פורסמה גרסה ראשונה'}
          </p>
        )}
        {!offline && !migrationMissing && !loading && publishBlocked && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-600/5 p-3 text-xs leading-relaxed text-red-600">
            אי אפשר לפרסם עד שהתמהיל תקין: {mixProblems.join(' · ')}
          </p>
        )}
        {saveError && (
          <p className="mt-2 rounded-lg border border-red-300 bg-red-600/5 p-3 text-xs text-red-600">
            השמירה האחרונה נכשלה - בדקו את החיבור ונסו שוב.
          </p>
        )}

        {/* Tabs */}
        <div className="mt-5 flex gap-2">
          <TabButton active={tab === 'questions'} onClick={() => setTab('questions')}>
            ניהול מאגר השאלות ({questions.length})
          </TabButton>
          <TabButton active={tab === 'mix'} onClick={() => setTab('mix')}>
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

            <div className="mt-4 space-y-3">
              {visibleQuestions.map((question) => {
                const pillar = pillars.find((p) => p.id === question.pillarId)
                const isEditing = editingId === question.id
                return (
                  <div
                    key={question.id}
                    className={
                      'rounded-xl border border-line bg-white p-4 shadow-sm ' +
                      (question.active ? '' : 'opacity-60')
                    }
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full border border-line bg-cream px-2.5 py-0.5 font-medium text-navy">
                        {pillar?.short}
                      </span>
                      {question.pinned && (
                        <span className="rounded-full bg-navy px-2.5 py-0.5 font-medium text-white">
                          נעוצה בכל שאלון
                        </span>
                      )}
                      {!question.active && (
                        <span className="rounded-full bg-red-600/10 px-2.5 py-0.5 font-medium text-red-600">
                          כבויה
                        </span>
                      )}
                      <span className="grow" />
                      {!offline && !isEditing && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleTogglePin(question)}
                            className="text-muted underline underline-offset-2 transition-colors hover:text-navy"
                          >
                            {question.pinned ? 'ביטול נעיצה' : 'נעיצה'}
                          </button>
                          <button
                            type="button"
                            onClick={() => startEdit(question)}
                            className="text-muted underline underline-offset-2 transition-colors hover:text-navy"
                          >
                            עריכה
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(question.id)}
                            className="rounded-md px-2 py-0.5 font-medium text-red-600 transition-colors hover:bg-red-600/10"
                          >
                            מחיקה
                          </button>
                        </>
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
              })}
            </div>
          </section>
        )}

        {tab === 'mix' && (
          <section className="mt-5">
            <div className="space-y-3">
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
                    <div>
                      <p className="font-medium">{pillar.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{pillar.description}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {available} שאלות במאגר
                        {pinnedInPillar > 0 &&
                          (pinnedInPillar === 1 ? ' · נעוצה אחת' : ` · ${pinnedInPillar} נעוצות`)}
                      </p>
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
                    <input
                      type="number"
                      min={pinnedInPillar}
                      max={available}
                      value={pillar.quota}
                      disabled={offline}
                      onChange={(event) =>
                        void handleQuotaChange(pillar, Number.parseInt(event.target.value, 10) || 0)
                      }
                      className="w-16 rounded-lg border border-line p-2 text-center tabular-nums focus:border-navy focus:outline-none"
                      aria-label={`מספר שאלות: ${pillar.title}`}
                    />
                  </div>
                )
              })}
            </div>
            <div
              className={
                'mt-4 flex items-center justify-between rounded-xl border p-4 font-bold ' +
                (quotaSum === quizLength
                  ? 'border-line bg-white text-green-700'
                  : 'border-red-300 bg-red-600/5 text-red-600')
              }
            >
              <span>סה״כ בשאלון</span>
              <span className="tabular-nums">
                {quotaSum} / {quizLength}
              </span>
            </div>
            {quotaSum !== quizLength && (
              <p className="mt-2 text-xs text-red-600">
                יש להגיע בדיוק ל-{quizLength} כדי שהשאלון יעבוד כמתוכנן.
              </p>
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
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors ' +
        (active ? 'bg-navy text-white' : 'border border-line bg-white text-muted hover:text-navy')
      }
    >
      {children}
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
