// pillars.ts - the quiz pillars, after the merge decision (2026-08-10):
// the chapters under "החזון שלנו" are grouped into 7 pillars; the
// ישראל 2050 chapter was dropped entirely (her call, incl. its questions).
// The array order here is the display order everywhere (results, admin).
import type { Pillar } from './types'

export const VISION_URL = 'https://www.elhadegel.co.il/about-us'

export const PILLARS: Pillar[] = [
  {
    id: 'vision-victory',
    title: 'חזון והנהגה',
    short: 'חזון והנהגה',
    description: 'איחוד של: חזון ציוני למדינת ישראל + מחליפים את דור הכישלון בדור הניצחון.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'zionist-unity',
    title: 'ציונות ואחדות',
    short: 'ציונות ואחדות',
    description: 'איחוד של: ימין ושמאל Out | ציונות In + אחדות העם כתנאי לביטחון + קואליציה ציונית רחבה.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'winning-iron-wall',
    title: 'ניצחון והרתעה',
    short: 'ניצחון והרתעה',
    description: 'איחוד של: איך מדינת ישראל מתחילה לנצח? + ישראל אחרי עידן התמימות.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'service-integration',
    title: 'שירות ושילוב',
    short: 'שירות ושילוב',
    description: 'איחוד של: חוק יסוד: שירות אל הדגל + מנצחים את הסכנה הדמוגרפית.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'zionist-economy',
    title: 'כלכלה ציונית',
    short: 'כלכלה ציונית',
    description: 'המעמד המשרת במרכז: מתגמלים תרומה למדינה, לא כוח פוליטי וקומבינות.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'education-revolution',
    title: 'מהפכת החינוך הציוני',
    short: 'מהפכת החינוך',
    description: 'ליבה לאומית משותפת - מקצועית וערכית - לכל מוסד מתוקצב, לצד חופש קהילתי.',
    sourceUrl: VISION_URL,
  },
  {
    id: 'legal-reform',
    title: 'הרפורמה המשפטית של ״אל הדגל״',
    short: 'הרפורמה המשפטית',
    description: 'תיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון בין הרשויות וממשלה רזה.',
    sourceUrl: VISION_URL,
  },
]

/** Quick lookup: pillar object by its id */
export function getPillar(id: string): Pillar | undefined {
  return PILLARS.find((p) => p.id === id)
}
