// Header.tsx - sticky top bar, same recipe as the reference site:
// semi-transparent white + backdrop blur + thin bottom border.
// When onSignOut is provided (admin screens), a sign-out button sits next
// to the badge - session actions live in the header, content actions below.
import Logo from './Logo'

export default function Header({ badge, onSignOut }: { badge?: string; onSignOut?: () => void }) {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {/* The logo is a link back to the quiz start */}
        <a href="#/" className="text-navy" aria-label="לעמוד הפתיחה">
          <Logo className="h-8 w-auto" />
        </a>
        {badge && (
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-navy px-3 py-1 text-xs font-medium text-white">{badge}</span>
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
