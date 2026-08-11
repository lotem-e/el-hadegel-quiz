-- Migration 12 - rename one category (Lotem, 2026-08-11):
--   "שבירת הגושים וכפיית ממשלה רחבה וציונית"
--     becomes
--   "שבירת הגושים וכפיית ממשלה ציונית רחבה"
--
-- Category copy, so the system-change envelope applies: this publishes
-- itself only if the draft was already fully published, and otherwise rides
-- along with Lotem's next publish. Run the whole file in ONE go - the
-- envelope raises if its two calls land in different transactions.

begin;
select public.system_change_begin();

update public.pillars
set title = 'שבירת הגושים וכפיית ממשלה ציונית רחבה',
    short = 'שבירת הגושים וכפיית ממשלה ציונית רחבה'
where id = 'zionist-unity';

select public.system_change_publish();
commit;
