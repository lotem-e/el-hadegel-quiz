// LikertScale.tsx - the 1-5 agree/disagree answer control.
// Vertical buttons work well on both mobile and desktop and keep the
// labels fully readable (no cramped 5-column row).
export const LIKERT_OPTIONS = [
  { value: 1, label: 'כלל לא מסכים/ה' },
  { value: 2, label: 'לא מסכים/ה' },
  { value: 3, label: 'ניטרלי/ת' },
  { value: 4, label: 'מסכים/ה' },
  { value: 5, label: 'מסכים/ה מאוד' },
]

interface LikertScaleProps {
  value: number | null
  onSelect: (value: number) => void
  disabled?: boolean
}

export default function LikertScale({ value, onSelect, disabled = false }: LikertScaleProps) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="עד כמה אתם מסכימים?">
      {LIKERT_OPTIONS.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onSelect(option.value)}
            className={
              'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-right font-medium transition-colors ' +
              (selected
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white hover:border-navy')
            }
          >
            <span
              className={
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums ' +
                (selected ? 'border-white/40 text-white' : 'border-line text-muted')
              }
            >
              {option.value}
            </span>
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
