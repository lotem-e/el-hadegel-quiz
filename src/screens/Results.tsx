// Results.tsx - the match percentage + per-pillar breakdown.
// The breakdown is a single-series bar list, so per the dataviz rules it
// uses ONE hue (brand navy) with a direct value label on every row - no
// rainbow, and text stays in text colors rather than the bar color.
import Header from '../components/Header'
import { scoreAnswers } from '../engine/scoring'
import type { Answer } from '../engine/scoring'
import { getContent } from '../store/contentStore'

interface ResultsProps {
  answers: Answer[]
  onRestart: () => void
}

function tierMessage(percent: number, threshold: number): string {
  if (percent >= threshold) return 'אתם אל הדגל. מקומכם איתנו על המפה.'
  if (percent >= 70) return 'קרובים מאוד לדרך שלנו.'
  if (percent >= 40) return 'יש בינינו לא מעט נקודות חיבור.'
  return 'נראה שהדרך שלנו פחות מדברת אליכם - ובכל זאת, מוזמנים להכיר אותה מקרוב.'
}

export default function Results({ answers, onRestart }: ResultsProps) {
  const content = getContent()
  const score = scoreAnswers(answers)
  const passedThreshold = score.totalPercent >= content.pinFlagThreshold

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8">
        {/* Hero number */}
        <section className="rounded-xl border border-line bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-muted">אחוז ההתאמה שלכם לדרך של אל הדגל</p>
          <p className="mt-2 text-6xl font-extrabold tabular-nums text-navy">{score.totalPercent}%</p>
          <p className="mt-3 font-medium">{tierMessage(score.totalPercent, content.pinFlagThreshold)}</p>
        </section>

        {/* Pin-the-flag invitation, only above the threshold */}
        {passedThreshold && (
          <section className="mt-4 rounded-xl bg-navy p-6 text-center text-white">
            <h2 className="text-lg font-bold">עברתם את רף ה-{content.pinFlagThreshold}%</h2>
            <p className="mt-1 text-sm text-white/80">
              הצטרפו לפרויקט ה-150,000 ונעצו את הדגל שלכם על המפה.
            </p>
            <a
              href={content.pinFlagUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg bg-white px-8 py-2.5 font-bold text-navy transition-colors hover:bg-cream"
            >
              נועצים את הדגל ↗
            </a>
          </section>
        )}

        {/* Per-pillar breakdown */}
        <section className="mt-4 rounded-xl border border-line bg-white p-6 shadow-sm">
          <h2 className="font-bold text-navy">פירוט לפי עמודי החזון</h2>
          <div className="mt-4 space-y-4">
            {score.byPillar.map((pillarScore) => {
              const pillar = content.pillars.find((p) => p.id === pillarScore.pillarId)
              const countLabel =
                pillarScore.questionCount === 1
                  ? 'היגד אחד בשאלון הזה'
                  : `${pillarScore.questionCount} היגדים בשאלון הזה`
              return (
                <div key={pillarScore.pillarId} title={countLabel}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{pillar?.short ?? pillarScore.pillarId}</span>
                    <span className="tabular-nums text-muted">{pillarScore.percent}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-navy"
                      style={{ width: `${pillarScore.percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-muted">
            ההיגדים נבחרים אקראית מתוך מאגר גדול יותר - כל שאלון מעט שונה.
          </p>
        </section>

        <button
          type="button"
          onClick={onRestart}
          className="mt-6 w-full rounded-lg border border-navy py-3 font-bold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          שאלון חדש
        </button>
      </main>
    </>
  )
}
