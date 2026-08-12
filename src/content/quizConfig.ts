// quizConfig.ts - how a single quiz is composed.
// DEFAULT_QUOTAS says how many questions come from each pillar ("the mix").
// The quiz LENGTH is not configured anywhere: it is simply what the mix
// produces (the sum of the quotas), so the admin controls it directly by
// editing the mix - nothing to keep in sync and nothing to validate against.
import type { PillarId } from './types'

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
export const PIN_FLAG_THRESHOLD = 80

/** Where "pin the flag" leads (the 150,000 project map) */
export const PIN_FLAG_URL = 'https://elhadegel-friends.com'
