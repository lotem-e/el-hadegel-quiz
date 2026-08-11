// Results.tsx - the match percentage, what it means, and where to go next.
//
// The per-category breakdown carries each category's own colour, the same
// one the admin uses, and every row opens to the sources that category's
// statements rest on - so a visitor who disagrees somewhere can go read the
// movement's own words on exactly that subject.
import Confetti from '../components/Confetti'
import Header from '../components/Header'
import JoinBlock from '../components/JoinBlock'
import { PLATFORM_PDF_URL, VISION_URL } from '../content/pillars'
import { scoreAnswers } from '../engine/scoring'
import type { Answer } from '../engine/scoring'
import { categoryColor } from '../lib/categoryColors'
import { GenderSwitch, useGender } from '../lib/gender'
import { getContent } from '../store/contentStore'

interface ResultsProps {
  answers: Answer[]
  onRestart: () => void
}

/**
 * The bands, and what each one offers. Above the flag threshold we invite
 * them to pin a flag; just below it another round is genuinely useful,
 * because each quiz is a sample of the pool and a second draw can settle a
 * borderline score; lower down we simply offer the material.
 */
const ANOTHER_ROUND_FLOOR = 75
const PARTIAL_FLOOR = 55

function tier(percent: number, flagThreshold: number) {
  if (percent >= flagThreshold) {
    return {
      headline: 'אתם/ן אל הדגל.',
      body: 'מקומכם/ן איתנו על המפה.',
    }
  }
  if (percent >= ANOTHER_ROUND_FLOOR) {
    return {
      headline: 'קרובים/ות מאוד לדרך שלנו.',
      body: 'סבב נוסף יביא היגדים שעוד לא ראיתם/ן, ויחדד את התמונה.',
    }
  }
  if (percent >= PARTIAL_FLOOR) {
    return {
      headline: 'יש בינינו לא מעט מן המשותף.',
      body: 'וגם מקומות שבהם אתם/ן חושבים/ות אחרת. שווה לקרוא מאיפה הדברים באים.',
    }
  }
  return {
    headline: 'נסכים לא להסכים.',
    body: 'הדרך שלנו פחות מדברת אליכם/ן, וגם זו תשובה. הדלת פתוחה אם תרצו להכיר אותה מקרוב.',
  }
}

export default function Results({ answers, onRestart }: ResultsProps) {
  const { g } = useGender()
  const content = getContent()
  const score = scoreAnswers(answers)
  const passedThreshold = score.totalPercent >= content.pinFlagThreshold
  const message = tier(score.totalPercent, content.pinFlagThreshold)
  const suggestAnotherRound =
    !passedThreshold && score.totalPercent >= ANOTHER_ROUND_FLOOR

  // Which category spoke to them most, and which least - only worth saying
  // when the quiz actually covered more than one.
  const ranked = [...score.byPillar].sort((a, b) => b.percent - a.percent)
  const strongest = ranked[0]
  const weakest = ranked[ranked.length - 1]
  const nameOf = (id: string) => content.pillars.find((p) => p.id === id)?.short ?? id
  const showExtremes = ranked.length > 1 && strongest.percent !== weakest.percent

  return (
    <>
      {passedThreshold && <Confetti />}
      <Header />
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        {/* Hero number */}
        <section className="rounded-xl border border-line bg-white p-6 text-center shadow-sm sm:p-8">
          <p className="text-sm text-muted">{g('אחוז ההתאמה שלכם/ן לדרך של אל הדגל')}</p>
          <p className="mt-2 text-5xl font-extrabold tabular-nums text-navy sm:text-6xl">
            {score.totalPercent}%
          </p>
          <p className="mt-3 font-bold text-navy">{g(message.headline)}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">{g(message.body)}</p>
        </section>

        {/* Pin-the-flag invitation, only above the threshold */}
        {passedThreshold && (
          <section className="mt-4 rounded-xl bg-navy p-6 text-center text-white">
            <h2 className="text-lg font-bold">
              {g('עברתם/ן את רף ה-')}
              {content.pinFlagThreshold}%
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {g('הצטרפו לפרויקט ה-150,000 ונעצו את הדגל שלכם/ן על המפה.')}
            </p>
            <a
              href={content.pinFlagUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg bg-white px-8 py-2.5 font-bold text-navy transition-colors hover:bg-cream"
            >
              {g('נועצים/ות את הדגל ↗')}
            </a>
          </section>
        )}

        {/* Per-category breakdown */}
        <section className="mt-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-navy">{g('איפה התחברתם/ן, ואיפה פחות')}</h2>

          {showExtremes && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted">{g('הכי התחברתם/ן')}</p>
                <p className="mt-0.5 flex items-center gap-2 text-sm font-bold text-navy">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: categoryColor(strongest.pillarId) }}
                  />
                  {nameOf(strongest.pillarId)}
                </p>
              </div>
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted">הכי פחות</p>
                <p className="mt-0.5 flex items-center gap-2 text-sm font-bold text-navy">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: categoryColor(weakest.pillarId) }}
                  />
                  {nameOf(weakest.pillarId)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {score.byPillar.map((pillarScore) => {
              const pillar = content.pillars.find((p) => p.id === pillarScore.pillarId)
              const color = categoryColor(pillarScore.pillarId)
              const sources = pillar?.sources ?? []
              return (
                <details key={pillarScore.pillarId} className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          aria-hidden="true"
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ backgroundColor: color }}
                        />
                        {pillar?.short ?? pillarScore.pillarId}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted">
                        {pillarScore.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pillarScore.percent}%`, backgroundColor: color }}
                      />
                    </div>
                    {sources.length > 0 && (
                      <span className="mt-1 inline-block text-xs text-muted underline underline-offset-2 group-open:hidden">
                        לקריאה נוספת
                      </span>
                    )}
                  </summary>
                  {sources.length > 0 && (
                    <ul className="mt-2 space-y-1 border-e-2 pe-3" style={{ borderColor: color }}>
                      {sources.map((source) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-navy underline underline-offset-2 hover:text-navy-dark"
                          >
                            {source.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </details>
              )
            })}
          </div>

          <p className="mt-4 text-xs text-muted">
            ההיגדים נבחרים אקראית מתוך מאגר גדול יותר - כל שאלון מעט שונה.
          </p>
        </section>

        {/* The two whole documents, for anyone who wants the full picture */}
        <section className="mt-4 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-navy">{g('רוצים/ות לקרוא את המקור המלא?')}</h2>
          <ul className="mt-2 space-y-1.5">
            <li>
              <a
                href={VISION_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy underline underline-offset-4 hover:text-navy-dark"
              >
                החזון של אל הדגל, באתר התנועה ↗
              </a>
            </li>
            <li>
              <a
                href={PLATFORM_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-navy underline underline-offset-4 hover:text-navy-dark"
              >
                המצע המלא ↗
              </a>
            </li>
          </ul>
        </section>

        <button
          type="button"
          onClick={onRestart}
          className={
            'mt-4 w-full rounded-lg py-3 font-bold transition-colors ' +
            (suggestAnotherRound
              ? 'bg-navy text-white hover:bg-navy-dark'
              : 'border border-navy text-navy hover:bg-navy hover:text-white')
          }
        >
          {suggestAnotherRound ? 'לסבב נוסף' : 'שאלון חדש'}
        </button>

        <div className="mt-6 flex justify-center">
          <GenderSwitch compact />
        </div>

        <div className="mt-6">
          <JoinBlock />
        </div>
      </main>
    </>
  )
}
