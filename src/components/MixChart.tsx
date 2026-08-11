// MixChart.tsx - the quiz composition, at a glance.
//
// Form: a donut. Part-to-whole is its one legitimate job, and the hole
// carries the number that matters most - the quiz length. The seven pillar
// names are long, so they live in a legend beside the ring rather than
// around it; the legend also names and counts every slice, so identity
// never rests on colour alone.
//
// Colour comes from the shared category palette (see lib/categoryColors),
// so a category looks the same here, in the filter pills and on the cards.
import type { Pillar } from '../content/types'
import { categoryColor } from '../lib/categoryColors'

// Ring geometry. The stroke is drawn along the circle's path, so gaps and
// segment lengths are expressed in path units (~pixels of arc).
const SIZE = 148
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP = 3

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

  // Walk the slices once, remembering where each one starts on the ring.
  let cumulative = 0
  const arcs = slices.map((slice) => {
    const length = total > 0 ? (slice.quota / total) * CIRCUMFERENCE : 0
    const start = cumulative
    cumulative += length
    return {
      ...slice,
      color: categoryColor(slice.id),
      length,
      start,
      percent: total > 0 ? Math.round((slice.quota / total) * 100) : 0,
    }
  })
  // A single slice covering the whole ring has no neighbour to separate
  // from, so it keeps its full length instead of losing a gap to nothing.
  const drawn = arcs.filter((arc) => arc.quota > 0)
  const gapFor = (arc: (typeof arcs)[number]) => (drawn.length > 1 ? Math.min(GAP, arc.length) : 0)

  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-navy">תמהיל השאלון</h2>

      {total === 0 ? (
        <p className="mt-3 text-xs text-muted">כל הקטגוריות על 0 - כרגע אין היגדים בשאלון.</p>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          {/* The ring starts at 12 and sweeps clockwise, so the FIRST
              categories land on the RIGHT half - the fill begins where
              Hebrew reading begins. (An earlier version mirrored the ring
              leftward; Lotem caught that it read backwards.) */}
          <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
            <svg
              width={SIZE}
              height={SIZE}
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={`תמהיל השאלון: ${total} היגדים`}
            >
              <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {drawn.map((arc) => {
                  const gap = gapFor(arc)
                  return (
                    <circle
                      key={arc.id}
                      cx={SIZE / 2}
                      cy={SIZE / 2}
                      r={RADIUS}
                      fill="none"
                      stroke={arc.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${Math.max(0, arc.length - gap)} ${CIRCUMFERENCE - Math.max(0, arc.length - gap)}`}
                      strokeDashoffset={-arc.start}
                    >
                      <title>{`${arc.label}: ${arc.quota} מתוך ${total} ( ${arc.percent}% )`}</title>
                    </circle>
                  )
                })}
              </g>
            </svg>
            {/* The hole carries the headline number */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold leading-none tabular-nums text-navy">
                {total}
              </span>
              <span className="mt-1 text-[10px] leading-none text-muted">היגדים בשאלון</span>
            </div>
          </div>

          {/* Legend: identity is never colour-alone. Laid out as text
              columns rather than a grid so it fills top-to-bottom - reading
              down a column follows the category order used on the page,
              which a row-major grid would scramble into 1,3,5,7. */}
          <ul className="w-full columns-1 gap-x-6 sm:columns-2">
            {arcs.map((arc) => (
              <li
                key={arc.id}
                className={
                  'flex break-inside-avoid items-center gap-2 py-0.5 text-xs ' +
                  (arc.quota === 0 ? 'opacity-45' : '')
                }
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: arc.color }}
                />
                {/* Names wrap rather than truncate - some are long */}
                <span className="leading-snug">{arc.label}</span>
                <span className="grow" />
                <span className="shrink-0 tabular-nums text-muted">
                  {arc.quota} · {arc.percent}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
