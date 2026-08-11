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

const OPTIONS: Array<{ mode: GenderMode; label: string; aria: string }> = [
  { mode: 'female', label: 'נקבה', aria: 'לפנות אליי בלשון נקבה' },
  { mode: 'neutral', label: 'שניהם', aria: 'לפנות אליי בשתי הלשונות' },
  { mode: 'male', label: 'זכר', aria: 'לפנות אליי בלשון זכר' },
]

/**
 * The switch itself. `compact` is the version that rides in the header;
 * the full one introduces itself, for the opening screen.
 */
export function GenderSwitch({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, g } = useGender()

  return (
    <div className={compact ? 'flex items-center gap-1.5' : 'flex flex-col items-center gap-1.5'}>
      {!compact && <span className="text-xs text-muted">{g('איך לפנות אליכם/ן?')}</span>}
      <div
        role="radiogroup"
        aria-label="לשון הפנייה"
        className="flex items-center gap-0.5 rounded-full border border-line bg-white p-0.5"
      >
        {OPTIONS.map((option) => {
          const selected = mode === option.mode
          return (
            <button
              key={option.mode}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.aria}
              onClick={() => setMode(option.mode)}
              className={
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors ' +
                (selected ? 'bg-navy text-white' : 'text-muted hover:text-navy')
              }
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
