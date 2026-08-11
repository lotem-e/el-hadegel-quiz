// ProgressBar.tsx - "question X of Y" + a thin fill bar.
// In RTL the fill naturally starts from the right, which is what we want.
export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.round((current / total) * 100)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-muted">
        <span>
          היגד {current} מתוך {total}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
        <div
          className="h-full rounded-full bg-navy transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
