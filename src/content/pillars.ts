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

export const PILLARS: Pillar[] = [
  {
    id: 'vision-victory',
    title: 'צו השעה - חזון והנהגה',
    short: 'צו השעה - חזון והנהגה',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בשתי ההבנות של ה-7 באוקטובר: חובת העוצמה, והנהגה מהדור שנלחם.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - חזון ציוני למדינת ישראל', url: 'https://www.elhadegel.co.il/about-us#principe-0' },
      { label: 'החזון שלנו - מחליפים את דור הכישלון בדור הניצחון', url: 'https://www.elhadegel.co.il/about-us#principe-12' },
      { label: 'המצע המלא - הקדמה ( עמ׳ 1-2 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=1' },
    ],
  },
  {
    id: 'zionist-unity',
    title: 'שבירת הגושים וכפיית ממשלה רחבה וציונית',
    short: 'שבירת הגושים וכפיית ממשלה רחבה וציונית',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בציונות שמעל מחנות: מה נכון לפני מי צודק, אחדות שאינה אחידות, וגוש ציוני רחב.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - ימין ושמאל Out | ציונות In', url: 'https://www.elhadegel.co.il/about-us#principe-5' },
      { label: 'החזון שלנו - אחדות העם כתנאי לביטחון', url: 'https://www.elhadegel.co.il/about-us#principe-1' },
      { label: 'החזון שלנו - קואליציה ציונית רחבה', url: 'https://www.elhadegel.co.il/about-us#principe-7' },
    ],
  },
  {
    id: 'winning-iron-wall',
    title: 'דגל הביטחון',
    short: 'דגל הביטחון',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בתפיסת הביטחון: הכרעה במקום סבבים, הסברה כחזית, יוזמה, ותנאי השלום.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - איך מדינת ישראל מתחילה לנצח?', url: 'https://www.elhadegel.co.il/about-us#principe-2' },
      { label: 'החזון שלנו - ישראל אחרי עידן התמימות', url: 'https://www.elhadegel.co.il/about-us#principe-3' },
      { label: 'המצע המלא - מצע ביטחון ( עמ׳ 3-9 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=3' },
    ],
  },
  {
    id: 'service-integration',
    title: 'חוק יסוד השירות',
    short: 'חוק יסוד השירות',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בשוויון בנטל ובשילוב: שירות לכל אזרח, שירות תמורת זכויות, ושותפות כלל החברה.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - חוק יסוד: שירות אל הדגל', url: 'https://www.elhadegel.co.il/about-us#principe-4' },
      { label: 'החזון שלנו - מנצחים את הסכנה הדמוגרפית', url: 'https://www.elhadegel.co.il/about-us#principe-10' },
      { label: 'המצע המלא - לכידות חברתית ( עמ׳ 4 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=4' },
      { label: 'הצעת חוק יסוד: שירות חובה למען המדינה ( נוסח מלא )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/service-law-bill.pdf' },
    ],
  },
  {
    id: 'education-revolution',
    title: 'דגל החינוך והלכידות',
    short: 'דגל החינוך והלכידות',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בחינוך ציוני משותף: ליבה אחת לכל הזרמים, מצוינות מורים, ודור גאה בציונותו.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - מהפכת החינוך הציוני', url: 'https://www.elhadegel.co.il/about-us#principe-8' },
      { label: 'המצע המלא - מצע חינוך ( עמ׳ 10-13 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=10' },
    ],
  },
  {
    id: 'legal-reform',
    title: 'דגל הממשל',
    short: 'דגל הממשל',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בתיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון רשויות, וממשלה מצומצמת.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', url: 'https://www.elhadegel.co.il/about-us#principe-9' },
      { label: 'המצע המלא - מצע ממשל ומשפט ( עמ׳ 14-19 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=14' },
    ],
  },
  {
    id: 'zionist-economy',
    title: 'דגל הכלכלה',
    short: 'דגל הכלכלה',
    description: 'בקטגוריה זו ישנם היגדים העוסקים בכלכלה שמתגמלת תרומה: המעמד המשרת במרכז, יוקר המחיה, ועבודה שמשתלמת.',
    sourceUrl: VISION_URL,
    sources: [
      { label: 'החזון שלנו - כלכלה ציונית', url: 'https://www.elhadegel.co.il/about-us#principe-6' },
      { label: 'המצע המלא - מצע כלכלה ( עמ׳ 20-25 )', url: 'https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=20' },
    ],
  },
]
/** Quick lookup: pillar object by its id */
export function getPillar(id: string): Pillar | undefined {
  return PILLARS.find((p) => p.id === id)
}
