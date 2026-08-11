-- Migration 9: deep links straight into the movement site's accordions.
-- Verified on the live site: loading about-us#principe-N scrolls to that
-- chapter AND opens it (aria-expanded becomes true, all others stay shut),
-- so each source now points at the exact chapter instead of the page top.
-- Run once in the Supabase SQL Editor, then publish from the admin.

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - חזון ציוני למדינת ישראל",
    "url": "https://www.elhadegel.co.il/about-us#principe-0"
  },
  {
    "label": "החזון שלנו - מחליפים את דור הכישלון בדור הניצחון",
    "url": "https://www.elhadegel.co.il/about-us#principe-12"
  },
  {
    "label": "המצע המלא - הקדמה ( עמ׳ 1-2 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=1"
  }
]'::jsonb where id = 'vision-victory';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - ימין ושמאל Out | ציונות In",
    "url": "https://www.elhadegel.co.il/about-us#principe-5"
  },
  {
    "label": "החזון שלנו - אחדות העם כתנאי לביטחון",
    "url": "https://www.elhadegel.co.il/about-us#principe-1"
  },
  {
    "label": "החזון שלנו - קואליציה ציונית רחבה",
    "url": "https://www.elhadegel.co.il/about-us#principe-7"
  }
]'::jsonb where id = 'zionist-unity';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - איך מדינת ישראל מתחילה לנצח?",
    "url": "https://www.elhadegel.co.il/about-us#principe-2"
  },
  {
    "label": "החזון שלנו - ישראל אחרי עידן התמימות",
    "url": "https://www.elhadegel.co.il/about-us#principe-3"
  },
  {
    "label": "המצע המלא - מצע ביטחון ( עמ׳ 3-9 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=3"
  }
]'::jsonb where id = 'winning-iron-wall';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - חוק יסוד: שירות אל הדגל",
    "url": "https://www.elhadegel.co.il/about-us#principe-4"
  },
  {
    "label": "החזון שלנו - מנצחים את הסכנה הדמוגרפית",
    "url": "https://www.elhadegel.co.il/about-us#principe-10"
  },
  {
    "label": "המצע המלא - לכידות חברתית ( עמ׳ 4 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=4"
  }
]'::jsonb where id = 'service-integration';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - מהפכת החינוך הציוני",
    "url": "https://www.elhadegel.co.il/about-us#principe-8"
  },
  {
    "label": "המצע המלא - מצע חינוך ( עמ׳ 10-13 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=10"
  }
]'::jsonb where id = 'education-revolution';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - הרפורמה המשפטית של ״אל הדגל״",
    "url": "https://www.elhadegel.co.il/about-us#principe-9"
  },
  {
    "label": "המצע המלא - מצע ממשל ומשפט ( עמ׳ 14-19 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=14"
  }
]'::jsonb where id = 'legal-reform';

update public.pillars set sources = '[
  {
    "label": "החזון שלנו - כלכלה ציונית",
    "url": "https://www.elhadegel.co.il/about-us#principe-6"
  },
  {
    "label": "המצע המלא - מצע כלכלה ( עמ׳ 20-25 )",
    "url": "https://lotem-e.github.io/el-hadegel-quiz/docs/full-platform.pdf#page=20"
  }
]'::jsonb where id = 'zionist-economy';
