// gender.tsx - who the quiz is speaking to.
//
// Hebrew forces a choice of gender in almost every sentence addressed to a
// reader, and the usual shortcut is to write masculine and call it neutral.
// Instead every visitor-facing string is written in the slash form
// ("קרובים/ות אתם/ן"), and Ivrita turns it into the form the visitor picked.
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

interface GenderContextValue {
  mode: GenderMode
  setMode: (mode: GenderMode) => void
  /** Render a slash-form string in the chosen gender */
  g: (text: string) => string
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

  const g = useCallback((text: string) => genderize(text, IVRITA_MODE[mode]), [mode])
  const value = useMemo(() => ({ mode, setMode: setModeState, g }), [mode, g])

  return <GenderContext.Provider value={value}>{children}</GenderContext.Provider>
}

export function useGender(): GenderContextValue {
  const value = useContext(GenderContext)
  // Outside a provider (tests, isolated rendering) behave as neutral rather
  // than throwing - the slash form is readable on its own.
  if (!value) {
    return { mode: 'neutral', setMode: () => {}, g: (text) => genderize(text, NEUTRAL) }
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
      <span className="ivrita-logo" title={BAR_TITLE} aria-hidden="true">
        {LOGO_ICON}
      </span>
      {OPTIONS.map((option) => {
        const selected = mode === option.mode
        return (
          <a
            key={option.mode}
            href="#"
            className={
              'ivrita-mode-changer ivrita-button ivrita-button-style-0' +
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
