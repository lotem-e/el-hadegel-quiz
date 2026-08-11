// ProgressBar.tsx - one segment per statement, so progress is countable at
// a glance ("two to go") instead of a percentage you have to translate.
// In RTL the row fills from the right on its own.
//
// The row above it carries the two controls that frame the quiz: going back
// on the right, where the reading starts, and the count on the left.
interface ProgressBarProps {
  current: number
  total: number
  /** Called when the visitor asks to revisit the previous statement */
  onBack: () => void
  /** False on the first statement, where there is nothing to go back to */
  canGoBack: boolean
}

export default function ProgressBar({ current, total, onBack, canGoBack }: ProgressBarProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        {/* First child sits at the right in RTL. The design is the back
            button from elhadegel-friends.com/welcome, measured live: 44px
            tall, rounded-xl, transparent until hover tints it navy/5, and a
            lucide arrow-right that slides 4px rightward on hover (rightward
            IS back, in RTL). Kept in the layout when disabled so the row
            never shifts between the first statement and the rest. */}
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          className="group inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-transparent px-6 text-sm font-semibold text-muted transition-all hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 disabled:pointer-events-none disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
          חזרה
        </button>
        {/* dir="ltr": the fraction reads 2 / 14 with the current number on
            the LEFT (Lotem's direction), and stays that way regardless of
            the RTL page around it. */}
        <span dir="ltr" className="flex items-baseline gap-1 text-muted">
          <span className="text-base font-bold tabular-nums text-navy">{current}</span>
          <span className="text-xs">/</span>
          <span className="tabular-nums">{total}</span>
        </span>
      </div>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`היגד ${current} מתוך ${total}`}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={
              'h-1.5 flex-1 rounded-full transition-colors duration-300 ' +
              (index < current ? 'bg-navy' : 'bg-line')
            }
          />
        ))}
      </div>
    </div>
  )
}
