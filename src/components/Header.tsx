// Header.tsx - sticky top bar, same recipe as the reference site:
// semi-transparent white + backdrop blur + thin bottom border.
// When onSignOut is provided (admin screens), the session actions sit beside
// the badge - going to see the quiz, and leaving.
import Logo from './Logo'

const iconClass = 'h-3.5 w-3.5 shrink-0'

/** Door with an arrow leaving it - the usual sign-out mark */
function SignOutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10" />
      <path d="M18 16l4-4-4-4" />
      <path d="M22 12H9" />
    </svg>
  )
}

/** An eye - going to look at the quiz the way a visitor sees it */
function ViewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden="true"
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

const actionClass =
  'flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-navy hover:text-navy'

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
              <>
                {/* Leaves the admin route, so the quiz renders in this same
                    tab. The admin session is untouched - coming back to
                    #/admin does not ask for the password again. */}
                <a href="#/" className={actionClass}>
                  <ViewIcon />
                  לשאלון
                </a>
                <button type="button" onClick={onSignOut} className={actionClass}>
                  <SignOutIcon />
                  התנתקות
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
