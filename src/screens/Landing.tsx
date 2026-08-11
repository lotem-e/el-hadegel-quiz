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

/**
 * The movement's own badge, copied value for value off the pill on
 * elhadegel-friends.com. Theirs is two elements - a wrapper carrying the shape
 * and a span carrying the type - so reading the wrapper alone gives you the
 * inherited 16px/400 and not the real text style. The type is on the span:
 *
 *   wrapper  bg-[#1B2D52]/5  ring-1 ring-[#1B2D52]/10  px-4 py-1.5  rounded-full
 *   text     text-xs font-semibold tracking-wide text-[#1B2D52]   -> 28px tall
 *
 * The tint plus a hairline ring is what makes it sit ON the cream rather than
 * float above it; a white fill with a solid border reads as a card. Merged
 * into one element here because Lotem does not want their navy dot, which is
 * the only reason theirs needed a wrapper.
 */
const pillClass =
  'rounded-full bg-navy/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-navy ring-1 ring-navy/10'

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
      {/* Two pills, in the movement's own badge style: what the quiz is, and
          what it costs you. They sit ABOVE the button (Lotem's order) - the
          cost is part of deciding to press, not a footnote after it. */}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <span className={pillClass}>{quizLength} היגדים</span>
        <span className={pillClass}>כ-{estimateMinutes(quizLength)} דקות</span>
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="mt-5 rounded-lg bg-navy px-12 py-3.5 text-lg font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-70"
      >
        {busy ? 'רק רגע...' : g(p('בואו נגלה', 'בוא/י נגלה'))}
      </button>
    </main>
  )
}
