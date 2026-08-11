// quizConfig.ts - how a single quiz is composed.
// Every quiz has QUIZ_LENGTH questions total. DEFAULT_QUOTAS says how many
// of them come from each pillar ("the mix"). These numbers are Lotem's own:
// she hand-tuned them in the admin mix editor (2026-08-10) and they were
// adopted here as the shipped default. The counts must always add up to
// QUIZ_LENGTH.
import type { PillarId } from './types'

export const QUIZ_LENGTH = 13

export const DEFAULT_QUOTAS: Record<PillarId, number> = {
  'vision-victory': 1,
  'zionist-unity': 1,
  'winning-iron-wall': 3,
  'service-integration': 2,
  'zionist-economy': 2,
  'education-revolution': 2,
  'legal-reform': 2,
}

/** Above this total score we invite the visitor to pin their flag */
export const PIN_FLAG_THRESHOLD = 90

/** Where "pin the flag" leads (the 150,000 project map) */
export const PIN_FLAG_URL = 'https://elhadegel-friends.com'
