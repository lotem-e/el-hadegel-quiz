// Landing.tsx - the opening screen: big logo, one sentence, one button.
import Logo from '../components/Logo'
import { VISION_URL } from '../content/pillars'
import { getContent } from '../store/contentStore'

export default function Landing({ onStart, busy = false }: { onStart: () => void; busy?: boolean }) {
  const quizLength = getContent().quizLength
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <Logo className="w-64 text-navy sm:w-72" />
      <h1 className="mt-10 text-3xl font-extrabold leading-tight text-navy sm:text-4xl">
        כמה קרובים אתם לדרך של אל הדגל?
      </h1>
      <p className="mt-4 max-w-md leading-relaxed text-muted">
        {quizLength} היגדים קצרים מתוך חזון התנועה. דרגו עד כמה אתם מסכימים עם כל
        אחד מהם, וגלו בסוף את אחוז ההתאמה שלכם.
      </p>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="mt-8 rounded-lg bg-navy px-12 py-3.5 text-lg font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-70"
      >
        {busy ? 'רק רגע...' : 'מתחילים'}
      </button>
      <p className="mt-3 text-sm text-muted">{quizLength} שאלות · כ-3 דקות</p>
      <a
        href={VISION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-14 text-sm text-navy underline underline-offset-4 hover:text-navy-dark"
      >
        לקריאת החזון המלא באתר התנועה ↗
      </a>
    </main>
  )
}
