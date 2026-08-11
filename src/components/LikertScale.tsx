// LikertScale.tsx - the 1-5 agree/disagree answer control.
// Vertical buttons work well on both mobile and desktop and keep the
// labels fully readable (no cramped 5-column row).
import { useEffect } from 'react'
import { p } from '../lib/gender'
import { useGender } from '../lib/gender'

export const LIKERT_OPTIONS = [
  { value: 1, label: p('כלל לא מסכימים', 'כלל לא מסכים/ה') },
  { value: 2, label: p('לא מסכימים', 'לא מסכים/ה') },
  { value: 3, label: p('ניטרליים', 'ניטרלי/ת') },
  { value: 4, label: p('מסכימים', 'מסכים/ה') },
  { value: 5, label: p('מסכימים מאוד', 'מסכים/ה מאוד') },
]

interface LikertScaleProps {
  value: number | null
  onSelect: (value: number) => void
  disabled?: boolean
  /** Answer with the number keys 1-5 */
  enableKeyboard?: boolean
}

export default function LikertScale({
  value,
  onSelect,
  disabled = false,
  enableKeyboard = false,
}: LikertScaleProps) {
  const { g } = useGender()

  useEffect(() => {
    if (!enableKeyboard || disabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      // Ignore while typing somewhere, or with a modifier held.
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      const picked = Number(event.key)
      if (picked >= 1 && picked <= LIKERT_OPTIONS.length) {
        event.preventDefault()
        onSelect(picked)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enableKeyboard, disabled, onSelect])

  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label={g(p('עד כמה אתם מסכימים?', 'עד כמה את/ה מסכים/ה?'))}>
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
            // min-h-12 keeps every option a comfortable tap target on a phone
            className={
              'flex min-h-12 w-full items-center gap-3 rounded-lg border px-4 py-3 text-right font-medium transition-colors ' +
              (selected
                ? 'border-navy bg-navy text-white'
                : 'border-line bg-white hover:border-navy active:border-navy')
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
            {g(option.label)}
          </button>
        )
      })}
    </div>
  )
}
