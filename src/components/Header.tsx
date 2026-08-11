// Header.tsx - sticky top bar, same recipe as the reference site:
// semi-transparent white + backdrop blur + thin bottom border.
// When onSignOut is provided (admin screens), a sign-out button sits next
// to the badge - session actions live in the header, content actions below.
import Logo from './Logo'

export default function Header({ badge, onSignOut }: { badge?: string; onSignOut?: () => void }) {
  const hasActions = Boolean(badge || onSignOut)

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur-md">
      {/* The logo is centred on the page, not tucked into a corner. It is
          absolutely positioned so the actions on the side cannot pull it off
          centre - with a plain flex row, a wide sign-out button would. */}
      <div className="relative mx-auto flex h-14 max-w-3xl items-center px-4">
        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          {/* Not a link: it goes nowhere, so it must not invite a click */}
          <Logo className="h-8 w-auto text-navy" />
        </div>
        {hasActions && (
          <div className="z-10 ms-auto flex items-center gap-2">
            {badge && (
              <span className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">
                {badge}
              </span>
            )}
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-navy hover:text-navy"
              >
                התנתקות
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
