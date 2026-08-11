// pillars.ts - the quiz pillars (baked fallback + original seed; the live
// source of truth is the pillars table in Supabase).
// After the merge decision (2026-08-10) the vision chapters are grouped
// into 7 pillars. Descriptions answer "what does this pillar measure";
// sources point at the real material - the vision page and the platform
// PDF hosted on our own site (so page jumps work in the browser viewer).
// The array order here is the display order everywhere (results, admin).
import type { Pillar } from './types'

export const VISION_URL = 'https://www.elhadegel.co.il/about-us'
export const PLATFORM_PDF_URL = 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf'

const VISION_SOURCE = { label: 'החזון שלנו באתר התנועה', url: VISION_URL }

export const PILLARS: Pillar[] = [
  {
    id: 'vision-victory',
    title: 'חזון והנהגה',
    short: 'חזון והנהגה',
    description: 'שתי ההבנות של ה-7 באוקטובר: חובת העוצמה, והנהגה מהדור שנלחם.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - הקדמה ( עמ׳ 1-2 )', url: PLATFORM_PDF_URL + '#page=1' },
    ],
  },
  {
    id: 'zionist-unity',
    title: 'ציונות ואחדות',
    short: 'ציונות ואחדות',
    description: 'ציונות שמעל מחנות: מה נכון לפני מי צודק, אחדות שאינה אחידות, וגוש ציוני רחב.',
    sourceUrl: VISION_URL,
    sources: [VISION_SOURCE],
  },
  {
    id: 'winning-iron-wall',
    title: 'ניצחון והרתעה',
    short: 'ניצחון והרתעה',
    description: 'תפיסת הביטחון: הכרעה במקום סבבים, הסברה כחזית, יוזמה, ותנאי השלום.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - מצע ביטחון ( עמ׳ 3-9 )', url: PLATFORM_PDF_URL + '#page=3' },
    ],
  },
  {
    id: 'service-integration',
    title: 'שירות ושילוב',
    short: 'שירות ושילוב',
    description: 'שוויון בנטל ושילוב: שירות לכל אזרח, שירות תמורת זכויות, ושותפות כלל החברה.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - לכידות חברתית ( עמ׳ 4 )', url: PLATFORM_PDF_URL + '#page=4' },
    ],
  },
  {
    id: 'zionist-economy',
    title: 'כלכלה ציונית',
    short: 'כלכלה ציונית',
    description: 'כלכלה שמתגמלת תרומה: המעמד המשרת במרכז, יוקר המחיה, ועבודה שמשתלמת.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - מצע כלכלה ( עמ׳ 20-25 )', url: PLATFORM_PDF_URL + '#page=20' },
    ],
  },
  {
    id: 'education-revolution',
    title: 'מהפכת החינוך הציוני',
    short: 'מהפכת החינוך',
    description: 'חינוך ציוני משותף: ליבה אחת לכל הזרמים, מצוינות מורים, ודור גאה בציונותו.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - מצע חינוך ( עמ׳ 10-13 )', url: PLATFORM_PDF_URL + '#page=10' },
    ],
  },
  {
    id: 'legal-reform',
    title: 'הרפורמה המשפטית של ״אל הדגל״',
    short: 'הרפורמה המשפטית',
    description: 'תיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון רשויות, וממשלה מצומצמת.',
    sourceUrl: VISION_URL,
    sources: [
      VISION_SOURCE,
      { label: 'המצע המלא - מצע ממשל ומשפט ( עמ׳ 14-19 )', url: PLATFORM_PDF_URL + '#page=14' },
    ],
  },
]

/** Quick lookup: pillar object by its id */
export function getPillar(id: string): Pillar | undefined {
  return PILLARS.find((p) => p.id === id)
}
