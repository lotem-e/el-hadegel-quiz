// selectQuestions.ts - builds one quiz out of the big pool.
// The rule: for each pillar take `quota` random ACTIVE questions,
// then shuffle the combined list so pillars are mixed together.
import type { PillarId, Question } from '../content/types'
import { getContent } from '../store/contentStore'

/**
 * Fisher-Yates shuffle. Returns a NEW array (does not touch the original).
 * This is the standard unbiased way to shuffle: walk from the end,
 * swap each item with a random item before it (or itself).
 */
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function selectQuizQuestions(
  allQuestions: Question[],
  quotas: Record<PillarId, number>,
): Question[] {
  const picked: Question[] = []
  // Walk pillars in their canonical order so the composition is stable.
  for (const pillar of getContent().pillars) {
    const quota = quotas[pillar.id] ?? 0
    const pool = allQuestions.filter((question) => question.pillarId === pillar.id && question.active)
    // If a pillar has fewer active questions than its quota we take what
    // exists. The admin mix screen warns about this situation.
    picked.push(...shuffle(pool).slice(0, quota))
  }
  return shuffle(picked)
}
