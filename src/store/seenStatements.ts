// seenStatements.ts - which statements this visitor has already met.
//
// Only so that a second round can show them something new. It lives in
// sessionStorage: it survives a refresh, and it disappears when the tab
// closes, so nobody is tracked and the pool feels fresh again on a later
// visit. Nothing here identifies anyone.
const KEY = 'elhadegel-seen-v1'

function load(): Set<string> {
  try {
    const raw = sessionStorage.getItem(KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

let seen = load()

export function getSeenStatements(): ReadonlySet<string> {
  return seen
}

export function rememberStatements(ids: string[]): void {
  for (const id of ids) seen.add(id)
  try {
    sessionStorage.setItem(KEY, JSON.stringify([...seen]))
  } catch {
    // Storage unavailable - we simply lose the preference for novelty.
  }
}

/** Used by the tests; also the natural thing to call if a reset is ever added */
export function forgetStatements(): void {
  seen = new Set()
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nothing to do
  }
}
