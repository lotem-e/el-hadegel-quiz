-- Migration 7: category names + descriptions (Lotem's copy, 2026-08-11).
--
-- This SUPERSEDES migration 6: it sets the same names plus the reworded
-- descriptions, and every statement is a plain overwrite - so running it is
-- safe whether or not migration 6 was already run. Run it once in the
-- Supabase SQL Editor, then publish from the admin so the copy reaches
-- visitors.

update public.pillars set
  title = 'צו השעה - חזון והנהגה',
  short = 'צו השעה - חזון והנהגה',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בשתי ההבנות של ה-7 באוקטובר: חובת העוצמה, והנהגה מהדור שנלחם.'
where id = 'vision-victory';

update public.pillars set
  title = 'שבירת הגושים וכפיית ממשלה רחבה וציונית',
  short = 'שבירת הגושים וכפיית ממשלה רחבה וציונית',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בציונות שמעל מחנות: מה נכון לפני מי צודק, אחדות שאינה אחידות, וגוש ציוני רחב.'
where id = 'zionist-unity';

update public.pillars set
  title = 'דגל הביטחון',
  short = 'דגל הביטחון',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בתפיסת הביטחון: הכרעה במקום סבבים, הסברה כחזית, יוזמה, ותנאי השלום.'
where id = 'winning-iron-wall';

update public.pillars set
  title = 'חוק יסוד השירות',
  short = 'חוק יסוד השירות',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בשוויון בנטל ובשילוב: שירות לכל אזרח, שירות תמורת זכויות, ושותפות כלל החברה.'
where id = 'service-integration';

update public.pillars set
  title = 'דגל הכלכלה',
  short = 'דגל הכלכלה',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בכלכלה שמתגמלת תרומה: המעמד המשרת במרכז, יוקר המחיה, ועבודה שמשתלמת.'
where id = 'zionist-economy';

update public.pillars set
  title = 'דגל החינוך והלכידות',
  short = 'דגל החינוך והלכידות',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בחינוך ציוני משותף: ליבה אחת לכל הזרמים, מצוינות מורים, ודור גאה בציונותו.'
where id = 'education-revolution';

update public.pillars set
  title = 'דגל הממשל',
  short = 'דגל הממשל',
  description = 'בקטגוריה זו ישנן שאלות העוסקות בתיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון רשויות, וממשלה מצומצמת.'
where id = 'legal-reform';
