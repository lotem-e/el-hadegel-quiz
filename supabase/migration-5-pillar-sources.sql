-- Migration 5: pillar sources + descriptions rewritten for the mix tab.
-- Each pillar gets a one-line "what it measures" description and a list of
-- source links (the vision page + the platform PDF hosted on the site,
-- with page jumps). Run once in the Supabase SQL Editor.

alter table public.pillars add column sources jsonb not null default '[]'::jsonb;

update public.pillars set
  description = 'שתי ההבנות של ה-7 באוקטובר: חובת העוצמה, והנהגה מהדור שנלחם.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - הקדמה ( עמ׳ 1-2 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=1"}
  ]'::jsonb
where id = 'vision-victory';

update public.pillars set
  description = 'ציונות שמעל מחנות: מה נכון לפני מי צודק, אחדות שאינה אחידות, וגוש ציוני רחב.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"}
  ]'::jsonb
where id = 'zionist-unity';

update public.pillars set
  description = 'תפיסת הביטחון: הכרעה במקום סבבים, הסברה כחזית, יוזמה, ותנאי השלום.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - מצע ביטחון ( עמ׳ 3-9 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=3"}
  ]'::jsonb
where id = 'winning-iron-wall';

update public.pillars set
  description = 'שוויון בנטל ושילוב: שירות לכל אזרח, שירות תמורת זכויות, ושותפות כלל החברה.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - לכידות חברתית ( עמ׳ 4 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=4"}
  ]'::jsonb
where id = 'service-integration';

update public.pillars set
  description = 'כלכלה שמתגמלת תרומה: המעמד המשרת במרכז, יוקר המחיה, ועבודה שמשתלמת.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - מצע כלכלה ( עמ׳ 20-25 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=20"}
  ]'::jsonb
where id = 'zionist-economy';

update public.pillars set
  description = 'חינוך ציוני משותף: ליבה אחת לכל הזרמים, מצוינות מורים, ודור גאה בציונותו.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - מצע חינוך ( עמ׳ 10-13 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=10"}
  ]'::jsonb
where id = 'education-revolution';

update public.pillars set
  description = 'תיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון רשויות, וממשלה מצומצמת.',
  sources = '[
    {"label": "החזון שלנו באתר התנועה", "url": "https://www.elhadegel.co.il/about-us"},
    {"label": "המצע המלא - מצע ממשל ומשפט ( עמ׳ 14-19 )", "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=14"}
  ]'::jsonb
where id = 'legal-reform';
