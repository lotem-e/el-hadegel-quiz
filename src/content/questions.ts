// questions.ts - the full question pool (the "bank").
// REWRITTEN 2026-08-10 per Lotem's "quality over quantity" pass (50 sharp
// statements authored by reading each merged pillar's chapters TOGETHER),
// then EXTENDED same day after synthesizing the FULL party platform
// (25-page PDF, May 2026, copy at docs/full-platform-2026-05.pdf): platform
// statements for significant positions the short vision chapters did not
// carry, plus a clarity pass on the security pillar, followed by Lotem's
// editorial pruning and invited additions. 60 total.
// sourceLabel marks provenance: "החזון שלנו" = the about-us vision chapter,
// "המצע המלא" = the full platform PDF.
//
// Id policy (her firm rules): retired ids are never reused. Merged pillars
// use fresh id namespaces (vision-victory-*, zionist-unity-*, ...); in the
// standalone pillars, statements that survived the rewrite keep their
// original id (which is why some numbers are skipped there).
import type { Question } from './types'
import { VISION_URL } from './pillars'

// Small helper so every entry stays short and consistent.
function q(id: string, pillarId: Question['pillarId'], text: string, sourceLabel: string): Question {
  return { id, pillarId, text, active: true, sourceUrl: VISION_URL, sourceLabel }
}

// Source labels point at the ORIGINAL vision chapter(s) a statement is
// grounded in - combined labels mark statements that draw on two chapters.
const SRC = {
  vision: 'החזון שלנו - חזון ציוני למדינת ישראל',
  victory: 'החזון שלנו - מחליפים את דור הכישלון בדור הניצחון',
  visionVictory: 'החזון שלנו - חזון ציוני + דור הניצחון',
  camps: 'החזון שלנו - ימין ושמאל Out | ציונות In',
  unity: 'החזון שלנו - אחדות העם כתנאי לביטחון',
  coalition: 'החזון שלנו - קואליציה ציונית רחבה',
  campsCoalition: 'החזון שלנו - ימין ושמאל Out + קואליציה ציונית',
  winning: 'החזון שלנו - איך מדינת ישראל מתחילה לנצח?',
  ironWall: 'החזון שלנו - ישראל אחרי עידן התמימות',
  winningIronWall: 'החזון שלנו - מתחילים לנצח + קיר הברזל',
  serviceLaw: 'החזון שלנו - חוק יסוד: שירות אל הדגל',
  demographic: 'החזון שלנו - מנצחים את הסכנה הדמוגרפית',
  serviceDemographic: 'החזון שלנו - חוק השירות + הסכנה הדמוגרפית',
  economy: 'החזון שלנו - כלכלה ציונית',
  education: 'החזון שלנו - מהפכת החינוך הציוני',
  legal: 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״',
  intro: 'המצע המלא - הקדמה: חזון ציוני למדינת ישראל',
  siteFlags: 'האתר הרשמי - הקדמת ארבעת הדגלים',
  // Full-platform sources (docs/full-platform-2026-05.pdf)
  secTimeline: 'המצע המלא - מצע ביטחון: היפוך שעון החול',
  secPeace: 'המצע המלא - מצע ביטחון: זרוע שלום יזום',
  secPeaceTrack: 'המצע המלא - מצע ביטחון: מסלול השלום המותנה',
  secSovereignty: 'המצע המלא - מצע ביטחון: יהודה ושומרון',
  secIdf: 'המצע המלא - מצע ביטחון: צה״ל גדול, חזק וחכם',
  secHasbara: 'המצע המלא - מצע ביטחון: חזית ההסברה כחזית ביטחונית',
  secCohesion: 'המצע המלא - מצע ביטחון: לכידות חברתית כבסיס לחוסן ביטחוני',
  secPrevention: 'המצע המלא - מצע ביטחון: מניעה יזומה והגנה רב-שכבתית',
  eduCore: 'המצע המלא - מצע חינוך: חבילת הבסיס הישראלית',
  eduPrep: 'המצע המלא - מצע חינוך: כיתה י״ב כשנת מכינה',
  eduTeacher: 'המצע המלא - מצע חינוך: שינוי פדגוגי ומעמד המורה',
  govLean: 'המצע המלא - מצע ממשל ומשפט: יעילות ממשלתית',
  govOverride: 'המצע המלא - מצע ממשל ומשפט: מערכת המשפט וחוקי היסוד',
  ecoWork: 'המצע המלא - מצע כלכלה: הציונות שבה לעבודה',
  ecoHousing: 'המצע המלא - מצע כלכלה: טיפול שורש במשבר הדיור',
  ecoIndustry: 'המצע המלא - מצע כלכלה: עקרונות היסוד',
} as const

export const BASE_QUESTIONS: Question[] = [
  // ==== חזון והנהגה ( חזון ציוני + דור הניצחון ) - 8 ====
  // Slimmed to exactly TWO statements at Lotem's request (2026-08-10 night):
  // the two understandings born on October 7 - security precedes everything,
  // and the called-to-the-flag generation should lead. Ids 3, 4, 5, 6, 7, 8
  // RETIRED. Ids never reused.
  q('vision-victory-1', 'vision-victory', 'אין לנו את הפריווילגיה לא להיות מעצמה. ביטחון, ביטחון, ביטחון - כי קודם צריך שתהיה מדינה, ורק אחר כך אפשר להתווכח איך היא תיראה', SRC.siteFlags),
  q('vision-victory-2', 'vision-victory', 'הפוליטיקה הישנה הביאה לסיאוב עמוק כל כך, עד שב-7 באוקטובר קרסו כל המערכות. הדור שהכי מתאים להנהיג עכשיו הוא הדור שנקרא אל הדגל - ויצא להילחם כדי להגן עלינו', SRC.intro),

  // ==== ציונות ואחדות ( ימין ושמאל Out + אחדות העם + קואליציה ציונית ) - 11 ====
  q('zionist-unity-1', 'zionist-unity', 'החלוקה לימין ושמאל כבר לא רלוונטית - השאלה האמיתית היא מה נכון למדינה', SRC.camps),
  q('zionist-unity-2', 'zionist-unity', 'ההשתייכות למחנה הפכה אצלנו לזהות, וזה שורש המשבר הפוליטי', SRC.camps),
  q('zionist-unity-3', 'zionist-unity', 'רוב הישראלים הם ציונים שקטים שרוצים מדינה מתוקנת וחזקה - ואין מי שמייצג אותם', SRC.campsCoalition),
  q('zionist-unity-4', 'zionist-unity', 'הפירוד הפנימי מסוכן לישראל לא פחות מהאיומים החיצוניים', SRC.unity),
  q('zionist-unity-5', 'zionist-unity', 'אחדות אינה אחידות - אפשר להיות מאוחדים גם בלי להסכים על הכול', SRC.unity),
  q('zionist-unity-6', 'zionist-unity', 'השאלה ״מה נכון״ חשובה יותר מהשאלה ״מי צודק״', SRC.unity),
  q('zionist-unity-7', 'zionist-unity', 'צבא שנשען על התנדבות ואמון לא ישרוד כשחלקים בעם מרגישים בחוץ', SRC.unity),
  q('zionist-unity-8', 'zionist-unity', 'מחנה ״רק ביבי״ ומחנה ״רק לא ביבי״ שיתקו את המדינה', SRC.coalition),
  q('zionist-unity-9', 'zionist-unity', 'צריך גוש ציוני חדש שמתאחד סביב ערכים, לא סביב מנהיג', SRC.coalition),
  q('zionist-unity-10', 'zionist-unity', 'ממשלה שנשענת על הסכמה לאומית רחבה עדיפה על קואליציה של דילים פוליטיים', SRC.coalition),
  q('zionist-unity-11', 'zionist-unity', 'עדיף לחפש פתרונות מאשר לחפש אשמים', SRC.camps),

  // ==== ניצחון והרתעה ( מתחילים לנצח + קיר הברזל ) - 8 ====
  // Note: winning-iron-wall ids 2, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17
  // were RETIRED 2026-08-10 at Lotem's request during editorial review.
  // Ids never reused.
  q('winning-iron-wall-1', 'winning-iron-wall', 'ניהול הסכסוך באמצעות סבבי לחימה והפסקות אש הוא בעצם קניית שקט שמשמעותה היא תשלום בריבית בהמשך. ישראל חייבת לסיים כל עימות בהכרעה צבאית ותודעתית ברורה', SRC.winning),
  q('winning-iron-wall-3', 'winning-iron-wall', 'ניצחון לא נגמר בשדה הקרב. ישנה גם חזית תודעתית המשפיעה על חופש הפעולה של צה״ל ועל ביטחון אזרחי ישראל, ועלינו, כמדינה, להבין את זה ולהילחם גם שם', SRC.winningIronWall),
  q('winning-iron-wall-4', 'winning-iron-wall', 'ההסברה היא חזית ביטחונית לכל דבר: ישראל צריכה מערך הסברה לאומי שפועל כל השנה, ולא רק בזמן מלחמה, בארץ ובעולם, עם אסטרטגיות מוכנות, שיתרגם כל אירוע מבצעי לרצף מסרים שמחזק את הלגיטימציה שלנו', SRC.secHasbara),
  q('winning-iron-wall-5', 'winning-iron-wall', 'ההנחה שאם ישראל תוותר על חלק מהאינטרסים הביטחוניים שלה תזכה אותה באהדה ובמעטפת הגנה - התבררה כאשליה. על ישראל לפעול בחוכמה בזירה הדיפלומטית אך היא חייבת לעמוד על תפיסת הביטחון שלה', SRC.ironWall),
  // wiw-10 and wiw-19 are Lotem's own texts (2026-08-10): her merged
  // peace-and-sovereignty statement, split into two per her decision.
  q('winning-iron-wall-10', 'winning-iron-wall', 'לגבי איו״ש, ישראל צריכה להבהיר, כלפי פנים וכלפי חוץ, שהיא מעוניינת בשלום, ועליה להיות ברורה לחלוטין לגבי התנאים - הפסקה מוחלטת של כל פעילות טרור והסתה, ויתור על טענות ל״זכות שיבה״, ופירוז מוחלט', SRC.secPeaceTrack),
  q('winning-iron-wall-19', 'winning-iron-wall', 'כל עוד התנאים ב״מסלול השלום״ שישראל הציבה אינם מתקיימים לפי לוח הזמנים, יש להחיל בהדרגה ריבונות בשטחי C, תוך כדי שמירה על פרימטר המאפשר לצה״ל הגנה אפקטיבית על היישובים', SRC.secSovereignty),
  q('winning-iron-wall-18', 'winning-iron-wall', 'ישראל חייבת לחזור להיות מדינה יוזמת ולא מגיבה: לקבוע בעצמה יעדים ולוחות זמנים - צבאיים, מדיניים ותודעתיים - במקום להמתין למשבר הבא ולפעול לפי הקצב של האויב', SRC.secTimeline),
  q('winning-iron-wall-20', 'winning-iron-wall', 'צה״ל חייב להיות גם ״צבא היי-טק״ וגם ״צבא עם״ גדול ומאומן, ובניין הכוח וסדרי העדיפויות התקציביים צריכים להיבחן בשאלה אחת: האם אזרחי ישראל יכולים לישון בשקט', SRC.secIdf),
  q('winning-iron-wall-21', 'winning-iron-wall', 'לכידות חברתית היא לא ערך רך אלא הכרח ביטחוני: כשהאמון בין חלקי החברה נשחק - נחלשים גם צה״ל, גם מערך המילואים וגם העורף', SRC.secCohesion),
  q('winning-iron-wall-22', 'winning-iron-wall', 'על ישראל לעבור מהגנת ״גדר״ להגנה המתבססת על מניעת איומים בעומק. ישראל צריכה לסכל איומים בעומק עוד לפני שהם קמים, ובוודאי לא לתת להם להתעצם', SRC.secPrevention),

  // ==== שירות ושילוב ( חוק יסוד שירות + הסכנה הדמוגרפית ) - 8 ====
  q('service-integration-1', 'service-integration', 'כל אזרח ישראלי - גבר או אישה, יהודי או לא - צריך לשרת: בצבא, בשירות לאומי או אזרחי', SRC.serviceLaw),
  q('service-integration-2', 'service-integration', 'אי אפשר להחזיק מדינה לאורך זמן על גבו של מיעוט שנושא את רוב הנטל', SRC.serviceDemographic),
  q('service-integration-3', 'service-integration', 'ראוי שמי שמשרת יקבל העדפה בדיור, בתעסוקה ובמלגות, ומי שבוחר שלא לשרת יצטרך לוותר על חלק מההטבות', SRC.serviceLaw),
  q('service-integration-4', 'service-integration', 'פטור גורף משירות לפי השתייכות מגזרית הוא אפליה בין אזרחים', SRC.serviceLaw),
  q('service-integration-5', 'service-integration', 'מדינה שבה שליש עובדים בשביל שני שלישים שלא נושאים בנטל - לא תחזיק מעמד', SRC.demographic),
  q('service-integration-6', 'service-integration', 'שילוב חרדים וערבים בשירות ובתעסוקה הוא הכרח ביטחוני ולאומי, לא גחמה חברתית', SRC.demographic),
  q('service-integration-7', 'service-integration', 'הממשלות קנו שקט בפטורים ובתקציבים במקום לדרוש שותפות - וזה חייב להיגמר', SRC.serviceDemographic),
  q('service-integration-8', 'service-integration', 'שילוב אמיתי מכבד את הזהות של כל קהילה: המטרה היא שותפות, לא טשטוש', SRC.demographic),

  // ==== כלכלה ציונית - 5 (id 3 retired; survivors keep their ids) ====
  q('zionist-economy-1', 'zionist-economy', 'המדינה צריכה לתגמל תרומה, לא קומבינה: מי שתורם - יקבל', SRC.economy),
  q('zionist-economy-2', 'zionist-economy', 'המעמד המשרת - מי שעובד, משלם מסים ונושא בנטל - צריך לעמוד במרכז סדרי העדיפויות', SRC.economy),
  q('zionist-economy-4', 'zionist-economy', 'חלוקת תקציבים לפי אינטרסים קואליציוניים היא העיוות המרכזי של הכלכלה הישראלית', SRC.economy),
  q('zionist-economy-5', 'zionist-economy', 'הדרך להוריד את יוקר המחיה היא ביטול מונופולים, חסמים ומכסים מיותרים', SRC.economy),
  q('zionist-economy-6', 'zionist-economy', 'מדינה חזקה דואגת לחלשים בלי להפוך תלות לאורח חיים', SRC.economy),
  q('zionist-economy-7', 'zionist-economy', 'עבודה צריכה להשתלם תמיד יותר מקצבה, עם תמריצים חיוביים למי שיוצא לעבוד', SRC.ecoWork),
  q('zionist-economy-8', 'zionist-economy', 'הפתרון האמיתי למשבר הדיור הוא הגדלת ההיצע: שחרור קרקעות וקיצוץ בירוקרטיית התכנון', SRC.ecoHousing),
  q('zionist-economy-9', 'zionist-economy', 'ישראל צריכה להפוך ממדינת אקזיטים שנמכרים לחו״ל למעצמה תעשייתית שמפתחת את הרעיונות אצלה', SRC.ecoIndustry),

  // ==== מהפכת החינוך הציוני - 5 (id 4 retired) ====
  q('education-revolution-1', 'education-revolution', 'כל מוסד חינוך מתוקצב חייב ללמד ליבה לאומית משותפת - מקצועית וערכית', SRC.education),
  q('education-revolution-2', 'education-revolution', 'ארבע מערכות חינוך שמספרות ארבעה סיפורים שונים על המדינה - ככה לא בונים עם', SRC.education),
  q('education-revolution-3', 'education-revolution', 'לצד הליבה המשותפת, לקהילות מגיע חופש להעמיק בחינוך לפי דרכן ואמונתן', SRC.education),
  q('education-revolution-5', 'education-revolution', 'צריך לתגמל מצוינות של מורים ולהשקיע יותר בבתי ספר באזורים מוחלשים', SRC.education),
  q('education-revolution-6', 'education-revolution', 'תפקיד החינוך הוא לגדל דור שאומר בטבעיות: אני ציוני', SRC.education),
  q('education-revolution-7', 'education-revolution', 'תקציב מדינה למוסדות חינוך חייב להיות מותנה בלימוד ליבת הבסיס המשותפת', SRC.eduCore),
  q('education-revolution-8', 'education-revolution', 'כדאי לצמצם את בחינות הבגרות ולהפוך את כיתה י״ב לשנת הכנה לחיים, לחברה ולשירות', SRC.eduPrep),
  q('education-revolution-9', 'education-revolution', 'הוראה צריכה להיות מקצוע עם בחינה, הסמכה ולשכה מקצועית, כמו עריכת דין', SRC.eduTeacher),

  // ==== הרפורמה המשפטית - 5 (id 6 retired) ====
  q('legal-reform-1', 'legal-reform', 'מערכת המשפט צריכה תיקון עמוק - לא הרס ולא נקמה', SRC.legal),
  q('legal-reform-2', 'legal-reform', 'חוקי יסוד ייקבעו רק ברוב גדול ומוסכם, וכך יקבלו מעמד חוקתי אמיתי', SRC.legal),
  q('legal-reform-3', 'legal-reform', 'בג״ץ יפסול חוקים רק בסתירה ישירה לחוק יסוד, לא על סמך עקרונות כלליים', SRC.legal),
  q('legal-reform-4', 'legal-reform', 'גם מי שרוצה לרסן את בית המשפט חייב לשמור על בלמים: בלי בלמים גם רכב חזק מתרסק', SRC.legal),
  q('legal-reform-5', 'legal-reform', 'צריך להגביל את כהונת ראש הממשלה לשמונה שנים', SRC.legal),
  q('legal-reform-7', 'legal-reform', 'צריך לקבוע בחוק יסוד: ממשלה של עד 16 שרים ומשרדים בלבד', SRC.govLean),
  q('legal-reform-8', 'legal-reform', 'לכנסת צריכה להיות אפשרות לחוקק מחדש חוק שנפסל, אבל רק ברוב מיוחד ובמגבלות זמן ונושא', SRC.govOverride),
]
