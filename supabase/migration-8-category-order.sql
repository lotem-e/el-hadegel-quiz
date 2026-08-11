-- Migration 8: category order - דגל הכלכלה moves below דגל הממשל.
-- sort_order drives the order everywhere (admin lists, filter pills, the
-- mix donut and the visitor's results breakdown). Run once in the Supabase
-- SQL Editor, then publish from the admin.
update public.pillars set sort_order = 0 where id = 'vision-victory';
update public.pillars set sort_order = 1 where id = 'zionist-unity';
update public.pillars set sort_order = 2 where id = 'winning-iron-wall';
update public.pillars set sort_order = 3 where id = 'service-integration';
update public.pillars set sort_order = 4 where id = 'education-revolution';
update public.pillars set sort_order = 5 where id = 'legal-reform';
update public.pillars set sort_order = 6 where id = 'zionist-economy';
