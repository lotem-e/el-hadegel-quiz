-- Migration 6: new category names (Lotem's naming, 2026-08-11).
-- Run once in the Supabase SQL Editor, then publish from the admin so the
-- names reach visitors.
update public.pillars set title = 'צו השעה - חזון והנהגה',                  short = 'צו השעה - חזון והנהגה'                  where id = 'vision-victory';
update public.pillars set title = 'שבירת הגושים וכפיית ממשלה רחבה וציונית', short = 'שבירת הגושים וכפיית ממשלה רחבה וציונית' where id = 'zionist-unity';
update public.pillars set title = 'דגל הביטחון',                            short = 'דגל הביטחון'                            where id = 'winning-iron-wall';
update public.pillars set title = 'חוק יסוד השירות',                        short = 'חוק יסוד השירות'                        where id = 'service-integration';
update public.pillars set title = 'דגל הכלכלה',                             short = 'דגל הכלכלה'                             where id = 'zionist-economy';
update public.pillars set title = 'דגל החינוך והלכידות',                    short = 'דגל החינוך והלכידות'                    where id = 'education-revolution';
update public.pillars set title = 'דגל הממשל',                              short = 'דגל הממשל'                              where id = 'legal-reform';
