// JoinBlock.tsx - the movement's "join us" panel, rebuilt from the block at
// the end of the printed platform: the QR on one side, the invitation and the
// social row on the other, with real space between them.
const SOCIALS = [
  { name: 'טיקטוק', url: 'https://www.tiktok.com/@elhadegel' },
  { name: 'אינסטגרם', url: 'https://www.instagram.com/elhadegel/' },
  { name: 'פייסבוק', url: 'https://www.facebook.com/people/%D7%90%D7%9C-%D7%94%D7%93%D7%92%D7%9C/61555500606447/' },
  { name: 'יוטיוב', url: 'https://www.youtube.com/@Elhadegel' },
  { name: 'אקס', url: 'https://x.com/elhadegel' },
]

const icon = 'h-4 w-4'

const ICONS: Record<string, React.ReactNode> = {
  טיקטוק: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06v-3.1a5.66 5.66 0 0 0-.77-.05A5.66 5.66 0 1 0 15.54 15.4V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48" />
    </svg>
  ),
  אינסטגרם: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={icon} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  פייסבוק: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4v-2c0-.6.4-1 1-1" />
    </svg>
  ),
  יוטיוב: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 4.8 12 4.8 12 4.8s-6.9 0-8.6.5A2.7 2.7 0 0 0 1.5 7.2C1 8.9 1 12 1 12s0 3.1.5 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 8.6.5 8.6.5s6.9 0 8.6-.5a2.7 2.7 0 0 0 1.9-1.9c.5-1.7.5-4.8.5-4.8s0-3.1-.5-4.8M9.8 15.3V8.7l5.7 3.3z" />
    </svg>
  ),
  אקס: (
    <svg viewBox="0 0 24 24" fill="currentColor" className={icon} aria-hidden="true">
      <path d="M18.2 2h3.3l-7.2 8.3L22.8 22h-6.6l-5.2-6.8L5.1 22H1.8l7.7-8.8L1.5 2h6.8l4.7 6.2zm-1.2 18h1.8L7.1 3.8H5.2z" />
    </svg>
  ),
}

export default function JoinBlock() {
  return (
    <section className="rounded-xl bg-navy p-5 text-white sm:p-6">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row-reverse sm:gap-10 sm:text-right">
        <img
          src="./join-qr.png"
          alt="קוד QR להצטרפות לתנועת אל הדגל"
          className="h-24 w-24 shrink-0 rounded-lg"
        />
        <div className="min-w-0 sm:flex-1">
          <h2 className="text-lg font-extrabold">הצטרפו אלינו</h2>
          <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            {SOCIALS.map((social) => (
              <li key={social.name}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  title={social.name}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                >
                  {ICONS[social.name]}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="https://www.elhadegel.co.il"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-white underline underline-offset-4 hover:text-white/80"
          >
            elhadegel.co.il ↗
          </a>
        </div>
      </div>
    </section>
  )
}
