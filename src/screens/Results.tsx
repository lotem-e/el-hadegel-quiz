// Results.tsx - the score, what it means, and the one action that follows.
//
// Three cards in a fixed order (Lotem's layout, 2026-08-11): the number with
// a scale that anchors it against the pin-flag threshold; then the verdict
// TOGETHER WITH the action it justifies - pin the flag above the threshold,
// read the source below it; then the per-category breakdown, whose rows carry
// their sources as chips. The verdict lives in the action card on purpose:
// it is the reason to press the button under it.
import Confetti from '../components/Confetti'
import Header from '../components/Header'
import JoinBlock from '../components/JoinBlock'
import { PLATFORM_PDF_URL, VISION_URL } from '../content/pillars'
import { scoreAnswers } from '../engine/scoring'
import type { Answer } from '../engine/scoring'
import { categoryColor } from '../lib/categoryColors'
import { p, useGender } from '../lib/gender'
import type { Phrase } from '../lib/gender'
import { getContent } from '../store/contentStore'

interface ResultsProps {
  answers: Answer[]
  onRestart: () => void
}

// Band edges below the pin threshold. Above ANOTHER_ROUND_FLOOR the gap is
// small enough to point at; above PARTIAL_FLOOR there is real common ground;
// below it we part as friends.
const ANOTHER_ROUND_FLOOR = 75
const PARTIAL_FLOOR = 55

// The movement's inbox. Both elhadegel.com and elhadegel.co.il receive mail
// (checked via their MX records) - but this exact mailbox still owes Lotem
// one test mail before launch.
const CONTACT_MAILTO = 'mailto:info@elhadegel.com'

/** The verdict and its reasoning, for the three bands below the threshold. */
function tier(percent: number): { headline: Phrase; body: Phrase; contactLabel: Phrase | null } {
  if (percent >= ANOTHER_ROUND_FLOOR) {
    return {
      // Lotem's wording, reaffirmed. First person plural, so it needs no
      // gender split at all.
      headline: p('אנחנו מחזיקים בדעות קרובות מאוד.', 'אנחנו מחזיקים בדעות קרובות מאוד.'),
      body: p(
        'מזמינים אתכם לחקור ולגלות על מה המחלוקת, וגם לאתגר אותנו.',
        'מזמינים אותך לחקור ולגלות על מה המחלוקת, וגם לאתגר אותנו.',
      ),
      contactLabel: p('תסבירו לנו', 'תסביר/י לנו'),
    }
  }
  if (percent >= PARTIAL_FLOOR) {
    return {
      headline: p('יש בינינו הרבה מן המשותף.', 'יש בינינו הרבה מן המשותף.'),
      // "נראה שיש בינינו מחלוקות" carries no address at all, so only the
      // invitation needs a singular form.
      body: p(
        'אבל בהחלט יש מקומות שבהם נראה שיש בינינו מחלוקות. אנחנו מזמינים אתכם לעיין במצע המלא ולאתגר אותנו.',
        'אבל בהחלט יש מקומות שבהם נראה שיש בינינו מחלוקות. אנחנו מזמינים אותך לעיין במצע המלא ולאתגר אותנו.',
      ),
      contactLabel: p('תסבירו לנו', 'תסביר/י לנו'),
    }
  }
  return {
    headline: p('נסכים שלא להסכים.', 'נסכים שלא להסכים.'),
    body: p(
      'הדרך שלנו פחות מדברת אליכם, וגם זו תשובה. אם בכל זאת הסתקרנתם - תוכלו לעיין במצע המלא שלנו, ללא פרשנות נוספת.',
      'הדרך שלנו פחות מדברת אליך, וגם זו תשובה. אם בכל זאת הסתקרנת - תוכל/י לעיין במצע המלא שלנו, ללא פרשנות נוספת.',
    ),
    contactLabel: null,
  }
}

/**
 * Source labels are written for the admin ("המצע המלא - מצע ביטחון ( עמ׳ 3-9 )")
 * and are too long for a chip. Shorten the shapes we know; anything
 * unrecognised passes through untouched, so a new label Lotem writes in the
 * database can never break the page.
 */
export function shortSourceLabel(label: string): string {
  const pages = label.match(/עמ׳ [\d-]+/)
  if (label.startsWith('המצע המלא') && pages) return `המצע · ${pages[0]}`
  if (label.startsWith('החזון שלנו - ')) return `החזון · ${label.slice('החזון שלנו - '.length)}`
  if (label.startsWith('הצעת חוק יסוד')) return 'נוסח החוק המלא'
  return label
}

const isPlatformSource = (label: string) => label.startsWith('המצע המלא')

export default function Results({ answers, onRestart }: ResultsProps) {
  const { g } = useGender()
  const content = getContent()
  const score = scoreAnswers(answers)
  const threshold = content.pinFlagThreshold
  const passedThreshold = score.totalPercent >= threshold
  const message = tier(score.totalPercent)
  const nameOf = (id: string) => g(content.pillars.find((pillar) => pillar.id === id)?.short ?? id)

  return (
    <>
      {passedThreshold && <Confetti />}
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        {/* The number, anchored: the scale shows where it sits against the
            pin threshold, so 71% stops being a floating figure. */}
        <section className="rounded-xl border border-line bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-muted">
            {g(p('אחוז ההתאמה שלכם לדרך של אל הדגל', 'אחוז ההתאמה שלך לדרך של אל הדגל'))}
          </p>
          <p className="mt-2 text-6xl font-extrabold tabular-nums text-navy">
            {score.totalPercent}%
          </p>
          {/* RTL: zero sits at the right edge, so the fill anchors right and
              the tick is measured from the right. */}
          <div className="relative mt-6 h-1.5 rounded-full bg-line">
            <div
              className="absolute inset-y-0 right-0 rounded-full bg-navy"
              style={{ width: `${score.totalPercent}%` }}
            />
            <div
              className="absolute -top-1 h-3.5 w-0.5 rounded bg-navy/35"
              style={{ right: `${threshold}%` }}
            />
          </div>
          <div className="relative mt-1.5 h-4">
            <span
              className="absolute text-[11px] text-muted"
              style={{ right: `${threshold}%`, transform: 'translateX(50%)' }}
            >
              {threshold}%
            </span>
          </div>

          {/* Why another quiz is a different quiz - part of understanding
              the number, so it lives with the number (Lotem's call). */}
          <p className="mt-5 text-xs leading-relaxed text-muted">
            ההיגדים נבחרים אקראית מתוך מאגר גדול יותר - כל שאלון מעט שונה.
            <br />
            {g(
              p(
                'רוצים לראות היגדים נוספים המשקפים את אל הדגל?',
                'רוצה לראות היגדים נוספים המשקפים את אל הדגל?',
              )
            )}{' '}
            <button
              type="button"
              onClick={onRestart}
              className="font-medium text-navy underline underline-offset-2 transition-colors hover:text-navy-dark"
            >
              {g(p('נסו שאלון חדש', 'נסה/י שאלון חדש'))}
            </button>
          </p>
        </section>

        {/* The verdict, and the action it justifies */}
        {passedThreshold ? (
          <section className="mt-4 rounded-xl bg-navy p-7 text-center text-white sm:p-8">
            <h2 className="text-2xl font-extrabold">
              {g(p('הדגל הזה גם שלכם.', 'הדגל הזה גם שלך.'))}
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/80">
              {g(
                p(
                  'פרויקט ה-150,000 אוסף את מי שהדרך הזאת מדברת אליהם. הדגל שלכם על המפה הוא הסימן שאתם שם.',
                  'פרויקט ה-150,000 אוסף את מי שהדרך הזאת מדברת אליהם. הדגל שלך על המפה הוא הסימן שאת/ה שם.',
                )
              )}
            </p>
            <a
              href={content.pinFlagUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-lg bg-white px-10 py-3 text-lg font-bold text-navy transition-colors hover:bg-cream"
            >
              {g(p('נועצים את הדגל ↗', 'נועץ/ת את הדגל ↗'))}
            </a>
          </section>
        ) : (
          <section className="mt-4 rounded-xl border border-line bg-white p-6 text-center shadow-sm sm:p-7">
            <h2 className="text-xl font-extrabold text-navy sm:text-2xl">{g(message.headline)}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              {g(message.body)}
              {message.contactLabel && (
                <>
                  {' '}
                  <a
                    href={CONTACT_MAILTO}
                    className="font-semibold text-navy underline underline-offset-2 hover:text-navy-dark"
                  >
                    {g(message.contactLabel)}
                  </a>
                </>
              )}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href={PLATFORM_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-navy px-7 py-2.5 font-bold text-white transition-colors hover:bg-navy-dark"
              >
                המצע המלא ↗
              </a>
              <a
                href={VISION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-navy px-7 py-2.5 font-bold text-navy transition-colors hover:bg-navy hover:text-white"
              >
                החזון שלנו ↗
              </a>
            </div>
          </section>
        )}

        {/* Per-category breakdown; each row carries its own sources */}
        <section className="mt-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-navy">
            {g(p('איפה התחברתם, ואיפה פחות', 'איפה התחברת, ואיפה פחות'))}
          </h2>
          <div className="mt-2 divide-y divide-line">
            {score.byPillar.map((pillarScore) => {
              const pillar = content.pillars.find((item) => item.id === pillarScore.pillarId)
              const color = categoryColor(pillarScore.pillarId)
              // Platform links lead the chips: seeing the platform itself is
              // the point of showing sources at all.
              const sources = [...(pillar?.sources ?? [])].sort(
                (a, b) => Number(isPlatformSource(b.label)) - Number(isPlatformSource(a.label)),
              )
              return (
                <div key={pillarScore.pillarId} className="py-3.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: color }}
                      />
                      {nameOf(pillarScore.pillarId)}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">{pillarScore.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pillarScore.percent}%`, backgroundColor: color }}
                    />
                  </div>
                  {sources.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sources.map((source) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            'rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ' +
                            (isPlatformSource(source.label)
                              ? 'border-navy/35 font-semibold text-navy hover:border-navy'
                              : 'border-line text-muted hover:border-navy hover:text-navy')
                          }
                        >
                          {g(shortSourceLabel(source.label))} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>


        <div className="mt-5">
          <JoinBlock />
        </div>
      </main>
    </>
  )
}
