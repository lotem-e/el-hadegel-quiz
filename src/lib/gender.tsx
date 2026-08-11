// gender.tsx - who the quiz is speaking to.
//
// Three ways to address a visitor, Lotem's scheme:
//   neutral - masculine PLURAL ("כמה קרובים אתם"), the default
//   male    - masculine SINGULAR ("כמה קרוב אתה")
//   female  - feminine SINGULAR ("כמה קרובה את")
//
// Ivrita cannot produce this on its own: it swaps gender within a number, but
// it cannot turn a plural into a singular. So each phrase is authored twice -
// see Phrase below - and Ivrita splits only the singular.
//
// Ivrita is AGPL-3.0, which is why this project carries the same licence.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FEMALE, MALE, NEUTRAL, genderize } from 'ivrita/src/ivrita'
// The official switch bar's own stylesheet, straight from the package.
import 'ivrita/src/ui/style.scss'

export type GenderMode = 'neutral' | 'male' | 'female'

const IVRITA_MODE: Record<GenderMode, number> = {
  neutral: NEUTRAL,
  male: MALE,
  female: FEMALE,
}

const STORAGE_KEY = 'elhadegel-gender-v1'

function loadPreference(): GenderMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'male' || saved === 'female' || saved === 'neutral') return saved
  } catch {
    // Storage unavailable - fall through to the default.
  }
  // Neutral is the honest default: it addresses everyone until asked.
  return 'neutral'
}

/**
 * A phrase in the two forms we have to author.
 *
 * `plural` is masculine plural, exactly as neutral mode shows it.
 * `singular` is the singular, with a slash ONLY where the two genders differ
 * in writing - and in Hebrew they often do not: "עברת", "התחברת", "שלך" and
 * "רוצה" are already the same for both, so most singular copy needs no slash.
 */
export interface Phrase {
  plural: string
  singular: string
}

interface GenderContextValue {
  mode: GenderMode
  setMode: (mode: GenderMode) => void
  /**
   * Render copy in the chosen address. A Phrase picks the plural for neutral
   * and lets Ivrita split the singular. A plain string is content that is
   * already gender-free (a statement, a category name) and passes through.
   */
  g: (text: string | Phrase) => string
}

/** Shorthand for authoring: p('כמה קרובים אתם', 'כמה קרוב/ה את/ה') */
export function p(plural: string, singular: string): Phrase {
  return { plural, singular }
}

export function renderPhrase(text: string | Phrase, mode: GenderMode): string {
  if (typeof text === 'string') {
    // Plain content. Nothing to choose, and genderize leaves slash-free text
    // untouched, so this is a pass-through in practice.
    return genderize(text, IVRITA_MODE[mode])
  }
  if (mode === 'neutral') return text.plural
  return genderize(text.singular, IVRITA_MODE[mode])
}

const GenderContext = createContext<GenderContextValue | null>(null)

export function GenderProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<GenderMode>(loadPreference)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // Preference simply will not persist.
    }
  }, [mode])

  const g = useCallback((text: string | Phrase) => renderPhrase(text, mode), [mode])
  const value = useMemo(() => ({ mode, setMode: setModeState, g }), [mode, g])

  return <GenderContext.Provider value={value}>{children}</GenderContext.Provider>
}

export function useGender(): GenderContextValue {
  const value = useContext(GenderContext)
  // Outside a provider (tests, isolated rendering) behave as neutral rather
  // than throwing - the slash form is readable on its own.
  if (!value) {
    return { mode: 'neutral', setMode: () => {}, g: (text) => renderPhrase(text, 'neutral') }
  }
  return value
}

/**
 * The official Ivrita switch bar.
 *
 * This is their bar, not a lookalike: the stylesheet imported above is
 * `node_modules/ivrita/src/ui/style.scss` verbatim, and the markup below
 * reproduces their `render()` exactly - same class names, same icon glyphs
 * from their Ivritacons font, same collapse-until-hover behaviour (their CSS
 * does that with `:focus-within`), same ⓘ link back to the project.
 *
 * What we do not use is their `DefaultSwitch` class itself. It builds its DOM
 * with a different JSX factory (`jsx-render`, not React) and appends itself to
 * `document.body` outside the React tree. Rendering the same markup from React
 * keeps one owner of the DOM, and their `setMode` was only ever a thin call
 * into whatever object you hand it - which here is React state.
 *
 * Their labels and icons, from src/ui/hebrew.js and src/ui/default.js.
 */
const BAR_TITLE = 'עבריתה'
const ABOUT_TEXT = 'אודות מיזם עבריתה'
const ABOUT_URL = 'https://alefalefalef.co.il/ivrita/'
const LOGO_ICON = '⚥︎'

// Their display order: male, female, neutral.
const OPTIONS: Array<{ mode: GenderMode; ivritaMode: number; label: string; icon: string }> = [
  { mode: 'male', ivritaMode: MALE, label: 'איש', icon: '♂︎' },
  { mode: 'female', ivritaMode: FEMALE, label: 'אישה', icon: '♀︎' },
  { mode: 'neutral', ivritaMode: NEUTRAL, label: 'ניטרלי', icon: '⚥︎' },
]

export function GenderSwitch() {
  const { mode, setMode } = useGender()

  return (
    <div
      className="ivrita-switch ivrita-switch--left"
      tabIndex={0}
      title={BAR_TITLE}
      role="radiogroup"
      aria-label={BAR_TITLE}
    >
      {/* Their stylesheet keys everything - the Ivritacons font, the 33px
          box, the colour - to `.ivrita-switch a`. A <span> here silently
          loses all of it, which is exactly what went wrong the first time:
          the collapsed bar, the part you see almost always, fell back to
          the page font. It stays an anchor, like theirs. */}
      <a
        href="#"
        className="ivrita-logo"
        tabIndex={-1}
        title={BAR_TITLE}
        aria-hidden="true"
        onClick={(event) => event.preventDefault()}
      >
        {LOGO_ICON}
      </a>
      {OPTIONS.map((option) => {
        const selected = mode === option.mode
        return (
          <a
            key={option.mode}
            href="#"
            className={
              // style-1 = the ss01 stylistic set of their icon font, which is
              // what alaxon.co.il uses and what Lotem pointed at as the look.
              // style-0 (the library default) is a different icon set entirely,
              // and marks the active option with a swash glyph rather than a
              // filled background.
              'ivrita-mode-changer ivrita-button ivrita-button-style-1' +
              (selected ? ' ivrita-active' : '')
            }
            data-ivrita-mode={option.ivritaMode}
            title={option.label}
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            onClick={(event) => {
              event.preventDefault()
              setMode(option.mode)
            }}
          >
            {option.icon}
          </a>
        )
      })}
      <a
        href={ABOUT_URL}
        className="ivrita-info-link"
        title={ABOUT_TEXT}
        aria-label={ABOUT_TEXT}
        target="_blank"
        rel="noopener noreferrer"
      >
        {'ⓘ'}
      </a>
    </div>
  )
}
