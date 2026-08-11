-- Migration 10: "שאלות" becomes "היגדים" in the category descriptions, and
-- the Basic Law bill joins the sources of חוק יסוד השירות.
-- Run once in the Supabase SQL Editor, then publish from the admin.

update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בשתי ההבנות של ה-7 באוקטובר: חובת העוצמה, והנהגה מהדור שנלחם.' where id = 'vision-victory';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בציונות שמעל מחנות: מה נכון לפני מי צודק, אחדות שאינה אחידות, וגוש ציוני רחב.' where id = 'zionist-unity';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בתפיסת הביטחון: הכרעה במקום סבבים, הסברה כחזית, יוזמה, ותנאי השלום.' where id = 'winning-iron-wall';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בשוויון בנטל ובשילוב: שירות לכל אזרח, שירות תמורת זכויות, ושותפות כלל החברה.' where id = 'service-integration';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בחינוך ציוני משותף: ליבה אחת לכל הזרמים, מצוינות מורים, ודור גאה בציונותו.' where id = 'education-revolution';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בתיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון רשויות, וממשלה מצומצמת.' where id = 'legal-reform';
update public.pillars set description = 'בקטגוריה זו ישנם היגדים העוסקים בכלכלה שמתגמלת תרומה: המעמד המשרת במרכז, יוקר המחיה, ועבודה שמשתלמת.' where id = 'zionist-economy';

-- append the bill to the service category's sources, without touching the rest
update public.pillars
set sources = sources || jsonb_build_array(
  jsonb_build_object('label', 'הצעת חוק יסוד: שירות חובה למען המדינה ( נוסח מלא )', 'url', 'https://lotem-e.github.io/el-hadegel-quiz/docs/service-law-bill.pdf')
)
where id = 'service-integration'
  and not (sources @> jsonb_build_array(jsonb_build_object('url', 'https://lotem-e.github.io/el-hadegel-quiz/docs/service-law-bill.pdf')));
