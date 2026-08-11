-- El HaDegel quiz - Supabase schema + seed
-- Generated from the repo content files - run once in the SQL Editor.

-- ===== Tables =====
create table public.pillars (
  id text primary key,
  title text not null,
  short text not null,
  description text not null default '',
  source_url text not null default '',
  quota int not null default 1,
  sort_order int not null
);

create table public.questions (
  id text primary key,
  pillar_id text not null references public.pillars(id),
  text text not null,
  active boolean not null default true,
  source_url text not null default '',
  source_label text not null default '',
  sort_order int not null
);

create table public.quiz_config (
  id boolean primary key default true check (id),
  quiz_length int not null,
  pin_flag_threshold int not null,
  pin_flag_url text not null
);

create table public.results (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  total_percent int not null,
  by_pillar jsonb not null,
  answers jsonb not null
);

-- ===== Row Level Security =====
alter table public.pillars enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_config enable row level security;
alter table public.results enable row level security;

-- content: everyone reads, only the signed-in admin writes
create policy "public read pillars" on public.pillars for select using (true);
create policy "public read questions" on public.questions for select using (true);
create policy "public read config" on public.quiz_config for select using (true);
create policy "admin write pillars" on public.pillars for all to authenticated using (true) with check (true);
create policy "admin write questions" on public.questions for all to authenticated using (true) with check (true);
create policy "admin write config" on public.quiz_config for all to authenticated using (true) with check (true);

-- results: anyone may submit, only the admin may read
create policy "anyone insert results" on public.results for insert to anon, authenticated with check (true);
create policy "admin read results" on public.results for select to authenticated using (true);

-- ===== Seed =====
insert into public.pillars (id, title, short, description, source_url, quota, sort_order) values
  ('vision-victory', 'חזון והנהגה', 'חזון והנהגה', 'איחוד של: חזון ציוני למדינת ישראל + מחליפים את דור הכישלון בדור הניצחון.', 'https://www.elhadegel.co.il/about-us', 1, 0),
  ('zionist-unity', 'ציונות ואחדות', 'ציונות ואחדות', 'איחוד של: ימין ושמאל Out | ציונות In + אחדות העם כתנאי לביטחון + קואליציה ציונית רחבה.', 'https://www.elhadegel.co.il/about-us', 1, 1),
  ('winning-iron-wall', 'ניצחון והרתעה', 'ניצחון והרתעה', 'איחוד של: איך מדינת ישראל מתחילה לנצח? + ישראל אחרי עידן התמימות.', 'https://www.elhadegel.co.il/about-us', 3, 2),
  ('service-integration', 'שירות ושילוב', 'שירות ושילוב', 'איחוד של: חוק יסוד: שירות אל הדגל + מנצחים את הסכנה הדמוגרפית.', 'https://www.elhadegel.co.il/about-us', 2, 3),
  ('zionist-economy', 'כלכלה ציונית', 'כלכלה ציונית', 'המעמד המשרת במרכז: מתגמלים תרומה למדינה, לא כוח פוליטי וקומבינות.', 'https://www.elhadegel.co.il/about-us', 2, 4),
  ('education-revolution', 'מהפכת החינוך הציוני', 'מהפכת החינוך', 'ליבה לאומית משותפת - מקצועית וערכית - לכל מוסד מתוקצב, לצד חופש קהילתי.', 'https://www.elhadegel.co.il/about-us', 2, 5),
  ('legal-reform', 'הרפורמה המשפטית של ״אל הדגל״', 'הרפורמה המשפטית', 'תיקון מאוזן של המשפט והממשל: חוקה מוסכמת, איזון בין הרשויות וממשלה רזה.', 'https://www.elhadegel.co.il/about-us', 2, 6);

insert into public.questions (id, pillar_id, text, active, source_url, source_label, sort_order) values
  ('vision-victory-1', 'vision-victory', 'אין לנו את הפריווילגיה לא להיות מעצמה. ביטחון, ביטחון, ביטחון - כי קודם צריך שתהיה מדינה, ורק אחר כך אפשר להתווכח איך היא תיראה', true, 'https://www.elhadegel.co.il/about-us', 'האתר הרשמי - הקדמת ארבעת הדגלים', 0),
  ('vision-victory-2', 'vision-victory', 'הפוליטיקה הישנה הביאה לסיאוב עמוק כל כך, עד שב-7 באוקטובר קרסו כל המערכות. הדור שהכי מתאים להנהיג עכשיו הוא הדור שנקרא אל הדגל - ויצא להילחם כדי להגן עלינו', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - הקדמה: חזון ציוני למדינת ישראל', 1),
  ('zionist-unity-1', 'zionist-unity', 'החלוקה לימין ושמאל כבר לא רלוונטית - השאלה האמיתית היא מה נכון למדינה', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - ימין ושמאל Out | ציונות In', 2),
  ('zionist-unity-2', 'zionist-unity', 'ההשתייכות למחנה הפכה אצלנו לזהות, וזה שורש המשבר הפוליטי', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - ימין ושמאל Out | ציונות In', 3),
  ('zionist-unity-3', 'zionist-unity', 'רוב הישראלים הם ציונים שקטים שרוצים מדינה מתוקנת וחזקה - ואין מי שמייצג אותם', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - ימין ושמאל Out + קואליציה ציונית', 4),
  ('zionist-unity-4', 'zionist-unity', 'הפירוד הפנימי מסוכן לישראל לא פחות מהאיומים החיצוניים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - אחדות העם כתנאי לביטחון', 5),
  ('zionist-unity-5', 'zionist-unity', 'אחדות אינה אחידות - אפשר להיות מאוחדים גם בלי להסכים על הכול', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - אחדות העם כתנאי לביטחון', 6),
  ('zionist-unity-6', 'zionist-unity', 'השאלה ״מה נכון״ חשובה יותר מהשאלה ״מי צודק״', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - אחדות העם כתנאי לביטחון', 7),
  ('zionist-unity-7', 'zionist-unity', 'צבא שנשען על התנדבות ואמון לא ישרוד כשחלקים בעם מרגישים בחוץ', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - אחדות העם כתנאי לביטחון', 8),
  ('zionist-unity-8', 'zionist-unity', 'מחנה ״רק ביבי״ ומחנה ״רק לא ביבי״ שיתקו את המדינה', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - קואליציה ציונית רחבה', 9),
  ('zionist-unity-9', 'zionist-unity', 'צריך גוש ציוני חדש שמתאחד סביב ערכים, לא סביב מנהיג', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - קואליציה ציונית רחבה', 10),
  ('zionist-unity-10', 'zionist-unity', 'ממשלה שנשענת על הסכמה לאומית רחבה עדיפה על קואליציה של דילים פוליטיים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - קואליציה ציונית רחבה', 11),
  ('zionist-unity-11', 'zionist-unity', 'עדיף לחפש פתרונות מאשר לחפש אשמים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - ימין ושמאל Out | ציונות In', 12),
  ('winning-iron-wall-1', 'winning-iron-wall', 'ניהול הסכסוך באמצעות סבבי לחימה והפסקות אש הוא בעצם קניית שקט שמשמעותה היא תשלום בריבית בהמשך. ישראל חייבת לסיים כל עימות בהכרעה צבאית ותודעתית ברורה', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - איך מדינת ישראל מתחילה לנצח?', 13),
  ('winning-iron-wall-3', 'winning-iron-wall', 'ניצחון לא נגמר בשדה הקרב. ישנה גם חזית תודעתית המשפיעה על חופש הפעולה של צה״ל ועל ביטחון אזרחי ישראל, ועלינו, כמדינה, להבין את זה ולהילחם גם שם', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מתחילים לנצח + קיר הברזל', 14),
  ('winning-iron-wall-4', 'winning-iron-wall', 'ההסברה היא חזית ביטחונית לכל דבר: ישראל צריכה מערך הסברה לאומי שפועל כל השנה, ולא רק בזמן מלחמה, בארץ ובעולם, עם אסטרטגיות מוכנות, שיתרגם כל אירוע מבצעי לרצף מסרים שמחזק את הלגיטימציה שלנו', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: חזית ההסברה כחזית ביטחונית', 15),
  ('winning-iron-wall-5', 'winning-iron-wall', 'ההנחה שאם ישראל תוותר על חלק מהאינטרסים הביטחוניים שלה תזכה אותה באהדה ובמעטפת הגנה - התבררה כאשליה. על ישראל לפעול בחוכמה בזירה הדיפלומטית אך היא חייבת לעמוד על תפיסת הביטחון שלה', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - ישראל אחרי עידן התמימות', 16),
  ('winning-iron-wall-10', 'winning-iron-wall', 'לגבי איו״ש, ישראל צריכה להבהיר, כלפי פנים וכלפי חוץ, שהיא מעוניינת בשלום, ועליה להיות ברורה לחלוטין לגבי התנאים - הפסקה מוחלטת של כל פעילות טרור והסתה, ויתור על טענות ל״זכות שיבה״, ופירוז מוחלט', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: מסלול השלום המותנה', 17),
  ('winning-iron-wall-19', 'winning-iron-wall', 'כל עוד התנאים ב״מסלול השלום״ שישראל הציבה אינם מתקיימים לפי לוח הזמנים, יש להחיל בהדרגה ריבונות בשטחי C, תוך כדי שמירה על פרימטר המאפשר לצה״ל הגנה אפקטיבית על היישובים', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: יהודה ושומרון', 18),
  ('winning-iron-wall-18', 'winning-iron-wall', 'ישראל חייבת לחזור להיות מדינה יוזמת ולא מגיבה: לקבוע בעצמה יעדים ולוחות זמנים - צבאיים, מדיניים ותודעתיים - במקום להמתין למשבר הבא ולפעול לפי הקצב של האויב', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: היפוך שעון החול', 19),
  ('winning-iron-wall-20', 'winning-iron-wall', 'צה״ל חייב להיות גם ״צבא היי-טק״ וגם ״צבא עם״ גדול ומאומן, ובניין הכוח וסדרי העדיפויות התקציביים צריכים להיבחן בשאלה אחת: האם אזרחי ישראל יכולים לישון בשקט', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: צה״ל גדול, חזק וחכם', 20),
  ('winning-iron-wall-21', 'winning-iron-wall', 'לכידות חברתית היא לא ערך רך אלא הכרח ביטחוני: כשהאמון בין חלקי החברה נשחק - נחלשים גם צה״ל, גם מערך המילואים וגם העורף', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: לכידות חברתית כבסיס לחוסן ביטחוני', 21),
  ('winning-iron-wall-22', 'winning-iron-wall', 'על ישראל לעבור מהגנת ״גדר״ להגנה המתבססת על מניעת איומים בעומק. ישראל צריכה לסכל איומים בעומק עוד לפני שהם קמים, ובוודאי לא לתת להם להתעצם', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ביטחון: מניעה יזומה והגנה רב-שכבתית', 22),
  ('service-integration-1', 'service-integration', 'כל אזרח ישראלי - גבר או אישה, יהודי או לא - צריך לשרת: בצבא, בשירות לאומי או אזרחי', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - חוק יסוד: שירות אל הדגל', 23),
  ('service-integration-2', 'service-integration', 'אי אפשר להחזיק מדינה לאורך זמן על גבו של מיעוט שנושא את רוב הנטל', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - חוק השירות + הסכנה הדמוגרפית', 24),
  ('service-integration-3', 'service-integration', 'ראוי שמי שמשרת יקבל העדפה בדיור, בתעסוקה ובמלגות, ומי שבוחר שלא לשרת יצטרך לוותר על חלק מההטבות', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - חוק יסוד: שירות אל הדגל', 25),
  ('service-integration-4', 'service-integration', 'פטור גורף משירות לפי השתייכות מגזרית הוא אפליה בין אזרחים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - חוק יסוד: שירות אל הדגל', 26),
  ('service-integration-5', 'service-integration', 'מדינה שבה שליש עובדים בשביל שני שלישים שלא נושאים בנטל - לא תחזיק מעמד', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מנצחים את הסכנה הדמוגרפית', 27),
  ('service-integration-6', 'service-integration', 'שילוב חרדים וערבים בשירות ובתעסוקה הוא הכרח ביטחוני ולאומי, לא גחמה חברתית', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מנצחים את הסכנה הדמוגרפית', 28),
  ('service-integration-7', 'service-integration', 'הממשלות קנו שקט בפטורים ובתקציבים במקום לדרוש שותפות - וזה חייב להיגמר', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - חוק השירות + הסכנה הדמוגרפית', 29),
  ('service-integration-8', 'service-integration', 'שילוב אמיתי מכבד את הזהות של כל קהילה: המטרה היא שותפות, לא טשטוש', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מנצחים את הסכנה הדמוגרפית', 30),
  ('zionist-economy-1', 'zionist-economy', 'המדינה צריכה לתגמל תרומה, לא קומבינה: מי שתורם - יקבל', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - כלכלה ציונית', 31),
  ('zionist-economy-2', 'zionist-economy', 'המעמד המשרת - מי שעובד, משלם מסים ונושא בנטל - צריך לעמוד במרכז סדרי העדיפויות', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - כלכלה ציונית', 32),
  ('zionist-economy-4', 'zionist-economy', 'חלוקת תקציבים לפי אינטרסים קואליציוניים היא העיוות המרכזי של הכלכלה הישראלית', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - כלכלה ציונית', 33),
  ('zionist-economy-5', 'zionist-economy', 'הדרך להוריד את יוקר המחיה היא ביטול מונופולים, חסמים ומכסים מיותרים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - כלכלה ציונית', 34),
  ('zionist-economy-6', 'zionist-economy', 'מדינה חזקה דואגת לחלשים בלי להפוך תלות לאורח חיים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - כלכלה ציונית', 35),
  ('zionist-economy-7', 'zionist-economy', 'עבודה צריכה להשתלם תמיד יותר מקצבה, עם תמריצים חיוביים למי שיוצא לעבוד', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע כלכלה: הציונות שבה לעבודה', 36),
  ('zionist-economy-8', 'zionist-economy', 'הפתרון האמיתי למשבר הדיור הוא הגדלת ההיצע: שחרור קרקעות וקיצוץ בירוקרטיית התכנון', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע כלכלה: טיפול שורש במשבר הדיור', 37),
  ('zionist-economy-9', 'zionist-economy', 'ישראל צריכה להפוך ממדינת אקזיטים שנמכרים לחו״ל למעצמה תעשייתית שמפתחת את הרעיונות אצלה', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע כלכלה: עקרונות היסוד', 38),
  ('education-revolution-1', 'education-revolution', 'כל מוסד חינוך מתוקצב חייב ללמד ליבה לאומית משותפת - מקצועית וערכית', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מהפכת החינוך הציוני', 39),
  ('education-revolution-2', 'education-revolution', 'ארבע מערכות חינוך שמספרות ארבעה סיפורים שונים על המדינה - ככה לא בונים עם', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מהפכת החינוך הציוני', 40),
  ('education-revolution-3', 'education-revolution', 'לצד הליבה המשותפת, לקהילות מגיע חופש להעמיק בחינוך לפי דרכן ואמונתן', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מהפכת החינוך הציוני', 41),
  ('education-revolution-5', 'education-revolution', 'צריך לתגמל מצוינות של מורים ולהשקיע יותר בבתי ספר באזורים מוחלשים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מהפכת החינוך הציוני', 42),
  ('education-revolution-6', 'education-revolution', 'תפקיד החינוך הוא לגדל דור שאומר בטבעיות: אני ציוני', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - מהפכת החינוך הציוני', 43),
  ('education-revolution-7', 'education-revolution', 'תקציב מדינה למוסדות חינוך חייב להיות מותנה בלימוד ליבת הבסיס המשותפת', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע חינוך: חבילת הבסיס הישראלית', 44),
  ('education-revolution-8', 'education-revolution', 'כדאי לצמצם את בחינות הבגרות ולהפוך את כיתה י״ב לשנת הכנה לחיים, לחברה ולשירות', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע חינוך: כיתה י״ב כשנת מכינה', 45),
  ('education-revolution-9', 'education-revolution', 'הוראה צריכה להיות מקצוע עם בחינה, הסמכה ולשכה מקצועית, כמו עריכת דין', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע חינוך: שינוי פדגוגי ומעמד המורה', 46),
  ('legal-reform-1', 'legal-reform', 'מערכת המשפט צריכה תיקון עמוק - לא הרס ולא נקמה', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', 47),
  ('legal-reform-2', 'legal-reform', 'חוקי יסוד ייקבעו רק ברוב גדול ומוסכם, וכך יקבלו מעמד חוקתי אמיתי', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', 48),
  ('legal-reform-3', 'legal-reform', 'בג״ץ יפסול חוקים רק בסתירה ישירה לחוק יסוד, לא על סמך עקרונות כלליים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', 49),
  ('legal-reform-4', 'legal-reform', 'גם מי שרוצה לרסן את בית המשפט חייב לשמור על בלמים: בלי בלמים גם רכב חזק מתרסק', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', 50),
  ('legal-reform-5', 'legal-reform', 'צריך להגביל את כהונת ראש הממשלה לשמונה שנים', true, 'https://www.elhadegel.co.il/about-us', 'החזון שלנו - הרפורמה המשפטית של ״אל הדגל״', 51),
  ('legal-reform-7', 'legal-reform', 'צריך לקבוע בחוק יסוד: ממשלה של עד 16 שרים ומשרדים בלבד', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ממשל ומשפט: יעילות ממשלתית', 52),
  ('legal-reform-8', 'legal-reform', 'לכנסת צריכה להיות אפשרות לחוקק מחדש חוק שנפסל, אבל רק ברוב מיוחד ובמגבלות זמן ונושא', true, 'https://www.elhadegel.co.il/about-us', 'המצע המלא - מצע ממשל ומשפט: מערכת המשפט וחוקי היסוד', 53);

insert into public.quiz_config (quiz_length, pin_flag_threshold, pin_flag_url) values (13, 90, 'https://elhadegel-friends.com');
