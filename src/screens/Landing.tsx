// Landing.tsx - the opening screen: big logo, one sentence, one button.
// Nothing here competes with the button; the links to the movement's
// material live on the results screen, where the visitor has a reason to
// follow them.
import Logo from '../components/Logo'
import { p, useGender } from '../lib/gender'
import { getContent } from '../store/contentStore'

/** Roughly twelve seconds a statement, rounded to a friendly number */
function estimateMinutes(statements: number): number {
  return Math.max(1, Math.round((statements * 12) / 60))
}

const pillClass =
  'rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy shadow-sm'

export default function Landing({ onStart, busy = false }: { onStart: () => void; busy?: boolean }) {
  const quizLength = getContent().quizLength
  const { g } = useGender()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <Logo className="w-64 text-navy sm:w-72" />
      <h1 className="mt-10 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
        {g(p('כמה קרובים אתם לדרך של אל הדגל?', 'כמה קרוב/ה את/ה לדרך של אל הדגל?'))}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        {g(
          p(
            'לפניכם היגדים מתוך החזון והמצע של התנועה. דרגו עד כמה אתם מסכימים עם כל אחד מהם, וגלו בסוף את אחוז ההתאמה שלכם.',
            'לפניך היגדים מתוך החזון והמצע של התנועה. דרג/י עד כמה את/ה מסכים/ה עם כל אחד מהם, וגלה/י בסוף את אחוז ההתאמה שלך.',
          )
        )}
      </p>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="mt-8 rounded-lg bg-navy px-12 py-3.5 text-lg font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-70"
      >
        {busy ? 'רק רגע...' : g(p('בואו נגלה', 'בוא/י נגלה'))}
      </button>
      {/* Two pills, in the movement's own badge style: what the quiz is, and
          what it costs you. Separate because they answer different questions. */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className={pillClass}>{quizLength} היגדים</span>
        <span className={pillClass}>כ-{estimateMinutes(quizLength)} דקות</span>
      </div>
    </main>
  )
}
