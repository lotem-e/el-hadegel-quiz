// MixChart.tsx - the quiz composition, at a glance.
//
// Form: a horizontal stacked bar, not a pie. Part-to-whole with 7 long
// Hebrew category names reads better as a stacked bar - the segments share
// one baseline so "3 questions vs 1" is directly comparable, the long names
// live in a legend instead of being crammed around a circle, and the shape
// fits the top of the page instead of eating vertical space.
//
// Colour: the categorical hues are assigned by pillar ORDER (identity),
// never by size, so a pillar keeps its colour when the mix changes. The
// palette was validated with the dataviz validator: every hue inside the
// lightness band, above the chroma floor, worst adjacent CVD separation
// 9.1 (target >= 8) and worst normal-vision separation 19.6 (floor 15).
// Three hues fall under 3:1 contrast against white, which obliges visible
// labels - hence the legend carries every name and number in text colours,
// so identity is never colour-alone.
import type { Pillar } from '../content/types'

/** Validated categorical palette, in fixed slot order */
const SERIES_COLORS = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
]

export interface MixSlice {
  id: string
  label: string
  quota: number
}

export function pillarSlices(pillars: Array<Pillar & { quota: number }>): MixSlice[] {
  return pillars.map((pillar) => ({ id: pillar.id, label: pillar.short, quota: pillar.quota }))
}

export default function MixChart({ slices }: { slices: MixSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.quota, 0)
  const shown = slices.filter((slice) => slice.quota > 0)

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold text-navy">תמהיל השאלון</h2>
        <p className="text-xs text-muted">
          <span className="text-base font-bold tabular-nums text-navy">{total}</span> שאלות בכל
          שאלון
        </p>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-xs text-muted">
          כל הפילרים על 0 - כרגע אין שאלות בשאלון.
        </p>
      ) : (
        <>
          {/* The bar: one baseline, 2px surface gaps, rounded outer ends */}
          <div className="mt-4 flex h-7 w-full gap-0.5 overflow-hidden rounded-md">
            {shown.map((slice) => {
              const percent = Math.round((slice.quota / total) * 100)
              const color = SERIES_COLORS[slices.findIndex((s) => s.id === slice.id) % SERIES_COLORS.length]
              return (
                <div
                  key={slice.id}
                  style={{ flexGrow: slice.quota, flexBasis: 0, backgroundColor: color }}
                  title={`${slice.label}: ${slice.quota} מתוך ${total} ( ${percent}% )`}
                />
              )
            })}
          </div>

          {/* Legend: identity is never colour-alone - every slice is named and counted */}
          <ul className="mt-3 grid grid-cols-1 gap-x-5 gap-y-1.5 sm:grid-cols-2">
            {slices.map((slice, index) => {
              const percent = total > 0 ? Math.round((slice.quota / total) * 100) : 0
              return (
                <li
                  key={slice.id}
                  className={
                    'flex items-center gap-2 text-xs ' + (slice.quota === 0 ? 'opacity-45' : '')
                  }
                >
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
                  />
                  <span className="truncate">{slice.label}</span>
                  <span className="grow" />
                  <span className="shrink-0 tabular-nums text-muted">
                    {slice.quota} · {percent}%
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
