// ProgressBar.tsx - one segment per statement, so progress is countable at
// a glance ("two to go") instead of a percentage you have to translate.
// In RTL the row fills from the right on its own.
export default function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>
          היגד {current} מתוך {total}
        </span>
        {current === total && <span className="font-medium text-navy">האחרון!</span>}
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
