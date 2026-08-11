// scoring.ts - turns 1-5 answers into a match percentage.
// Each answer maps linearly to percent: 1 -> 0, 2 -> 25, 3 -> 50, 4 -> 75, 5 -> 100.
// The final score is the plain average over all answered questions, so the
// pillar mix (how many questions each pillar got) IS the pillar weighting.
import type { PillarId } from '../content/types'
import { getContent } from '../store/contentStore'

export interface Answer {
  questionId: string
  pillarId: PillarId
  /** 1 (strongly disagree) .. 5 (strongly agree) */
  value: number
}

export interface PillarScore {
  pillarId: PillarId
  percent: number
  questionCount: number
}

export interface ScoreResult {
  totalPercent: number
  byPillar: PillarScore[]
}

export function valueToPercent(value: number): number {
  return ((value - 1) / 4) * 100
}

export function scoreAnswers(answers: Answer[]): ScoreResult {
  if (answers.length === 0) return { totalPercent: 0, byPillar: [] }

  const totalPercent = Math.round(
    answers.reduce((sum, answer) => sum + valueToPercent(answer.value), 0) / answers.length,
  )

  // Per-pillar breakdown for the results screen, in canonical pillar order.
  const byPillar: PillarScore[] = []
  for (const pillar of getContent().pillars) {
    const pillarAnswers = answers.filter((answer) => answer.pillarId === pillar.id)
    if (pillarAnswers.length === 0) continue
    byPillar.push({
      pillarId: pillar.id,
      percent: Math.round(
        pillarAnswers.reduce((sum, answer) => sum + valueToPercent(answer.value), 0) / pillarAnswers.length,
      ),
      questionCount: pillarAnswers.length,
    })
  }

  return { totalPercent, byPillar }
}
