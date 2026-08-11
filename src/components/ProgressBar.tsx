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
        {/* First child sits at the right in RTL */}
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack}
          // Kept in the layout even when it cannot be used, so the row never
          // shifts between the first statement and the rest.
          className={
            'rounded px-1 py-0.5 transition-colors ' +
            (canGoBack
              ? 'text-muted hover:text-navy'
              : 'cursor-not-allowed text-muted/35')
          }
        >
          חזרה
        </button>
        <span className="text-muted">
          <span className="tabular-nums">{current}</span> מתוך{' '}
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
