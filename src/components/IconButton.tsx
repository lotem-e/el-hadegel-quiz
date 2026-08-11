// IconButton.tsx - a small square action button with a styled tooltip.
// The label is the tooltip text and also the accessible name, so the
// button is never icon-only to a screen reader.
import type { ReactNode } from 'react'

interface IconButtonProps {
  label: string
  onClick: () => void
  children: ReactNode
  /** 'danger' tints the button red on hover, for destructive actions */
  tone?: 'default' | 'danger'
}

export default function IconButton({ label, onClick, children, tone = 'default' }: IconButtonProps) {
  const toneClasses =
    tone === 'danger'
      ? 'text-muted hover:bg-red-600/10 hover:text-red-600'
      : 'text-muted hover:bg-navy/10 hover:text-navy'

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={
          'flex h-7 w-7 items-center justify-center rounded-md transition-colors ' + toneClasses
        }
      >
        {children}
      </button>
      {/* Tooltip: shows on hover and on keyboard focus. Anchored to the
          button's outer edge and opening inward, because these buttons sit
          at the edge of their card - a centred tooltip would be clipped on
          a narrow screen. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full end-0 z-30 mt-1.5 hidden w-max max-w-[13rem] rounded-lg bg-navy-dark px-2.5 py-1.5 text-[11px] font-medium leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
      >
        {label}
      </span>
    </span>
  )
}

/* ---- Icons (inline so the project takes on no icon dependency) ---- */

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className: 'h-4 w-4',
  'aria-hidden': true,
}

export function PinIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg {...iconProps} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  )
}

/** A pin struck through: the button that will UNPIN, shown on pinned rows */
export function PinOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 17v5" />
      <path d="M15 9.34V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.89" />
      <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export function EditIcon() {
  return (
    <svg {...iconProps}>
      <path d="M21.17 6.81a1 1 0 0 0-3.98-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.63l4.35-1.33a2 2 0 0 0 .83-.5z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}
