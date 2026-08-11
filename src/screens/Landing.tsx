// Landing.tsx - the opening screen: big logo, one sentence, one button.
// Nothing here competes with the button; the links to the movement's
// material live on the results screen, where the visitor has a reason to
// follow them.
import Logo from '../components/Logo'
import { useGender } from '../lib/gender'
import { getContent } from '../store/contentStore'

/** Roughly twelve seconds a statement, rounded to a friendly number */
function estimateMinutes(statements: number): number {
  return Math.max(1, Math.round((statements * 12) / 60))
}

export default function Landing({ onStart, busy = false }: { onStart: () => void; busy?: boolean }) {
  const quizLength = getContent().quizLength
  const { g } = useGender()
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <Logo className="w-64 text-navy sm:w-72" />
      <h1 className="mt-10 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
        {g('כמה קרובים/ות אתם/ן לדרך של אל הדגל?')}
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        {quizLength} היגדים קצרים מתוך חזון התנועה.{' '}
        {g('דרגו עד כמה אתם/ן מסכימים/ות עם כל אחד מהם, וגלו בסוף את אחוז ההתאמה שלכם/ן.')}
      </p>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="mt-8 rounded-lg bg-navy px-12 py-3.5 text-lg font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-70"
      >
        {busy ? 'רק רגע...' : g('מתחילים/ות')}
      </button>
      <p className="mt-3 text-sm text-muted">
        {quizLength} היגדים · כ-{estimateMinutes(quizLength)} דקות
      </p>
      <div className="mt-10">
      </div>
    </main>
  )
}
