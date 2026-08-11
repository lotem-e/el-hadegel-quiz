// types.ts - the data shapes ("types") the whole app shares.
// TypeScript uses these to catch mistakes while we write code,
// e.g. a question with a pillar id that does not exist.

/**
 * The quiz pillars. Since Lotem's merge decision (2026-08-10) these GROUP
 * the vision chapters of https://www.elhadegel.co.il/about-us: four merged
 * pillars and three standalone ones (the ישראל 2050 chapter was dropped
 * entirely). A question's ORIGINAL chapter is recorded in its sourceLabel.
 */
export type PillarId =
  | 'vision-victory'
  | 'zionist-unity'
  | 'winning-iron-wall'
  | 'service-integration'
  | 'zionist-economy'
  | 'education-revolution'
  | 'legal-reform'

export interface Pillar {
  id: PillarId
  /** Full chapter title, exactly as it appears on the vision page */
  title: string
  /** Short label for charts and admin chips */
  short: string
  /** One-line summary shown in the admin */
  description: string
  /** Where this pillar's text lives */
  sourceUrl: string
}

export interface Question {
  id: string
  pillarId: PillarId
  /** The statement the visitor rates on a 1-5 agree/disagree scale */
  text: string
  /** Admins can switch a question off without deleting it */
  active: boolean
  /** Link back to the source material this question was derived from */
  sourceUrl: string
  sourceLabel: string
}
