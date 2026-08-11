// AuthGate.tsx - real authentication in front of the admin, enforced by
// Supabase. Unlike the old passcode gate, this is actual security: the
// database refuses writes from anyone without a valid session, so even
// someone who bypasses this screen cannot change shared content.
// (Signups are disabled in the Supabase dashboard - the only account is
// the admin's.)
import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Logo from './Logo'
import { supabase } from '../lib/supabaseClient'

type AuthStatus = 'checking' | 'signedOut' | 'signedIn'

export default function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setStatus('signedOut')
      return
    }
    // Restore an existing session, then keep following auth changes
    // (sign-in, sign-out, token refresh).
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'signedIn' : 'signedOut')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? 'signedIn' : 'signedOut')
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (status === 'signedIn') return <>{children}</>
  if (status === 'checking') {
    return <main className="flex min-h-dvh items-center justify-center text-muted">רק רגע...</main>
  }

  if (!supabase) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <Logo className="w-48 text-navy" />
        <p className="mt-8 max-w-sm text-sm leading-relaxed text-muted">
          החיבור למסד הנתונים עוד לא הוגדר, ולכן ממשק הניהול אינו זמין.
        </p>
        <a href="#/" className="mt-6 text-sm text-navy underline underline-offset-4">
          חזרה לשאלון
        </a>
      </main>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (signInError) setError('אימייל או סיסמה שגויים')
    // Success flows through onAuthStateChange above.
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo className="w-48 text-navy" />
      <form
        onSubmit={handleSubmit}
        className="mt-8 w-full max-w-xs rounded-xl border border-line bg-white p-6 shadow-sm"
      >
        <h1 className="font-bold text-navy">כניסת ניהול</h1>
        <input
          type="email"
          dir="ltr"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="אימייל"
          autoComplete="email"
          className="mt-4 w-full rounded-lg border border-line p-2.5 text-center focus:border-navy focus:outline-none"
        />
        <input
          type="password"
          dir="ltr"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="סיסמה"
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-line p-2.5 text-center focus:border-navy focus:outline-none"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-navy py-2.5 font-bold text-white transition-colors hover:bg-navy-dark disabled:opacity-50"
        >
          {busy ? 'מתחברת...' : 'כניסה'}
        </button>
      </form>
      <a href="#/" className="mt-6 text-sm text-muted hover:text-navy">
        חזרה לשאלון
      </a>
    </main>
  )
}
