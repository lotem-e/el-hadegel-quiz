-- Migration 14 - the dedicated education platform joins the sources of
-- דגל החינוך והלכידות (Lotem, 2026-08-12). The 7-page "מצע חינוך - אל הדגל"
-- now lives on the quiz site itself at docs/education-platform.pdf, like the
-- general platform before it, so the link keeps working wherever it is read.
--
-- Category copy - the envelope applies. Run the whole file in ONE go.

begin;
select public.system_change_begin();

update public.pillars
set sources = sources || jsonb_build_array(jsonb_build_object(
  'label', 'מצע החינוך המלא ( 7 עמ׳ )',
  'url', 'https://lotem-e.github.io/el-hadegel-quiz/docs/education-platform.pdf'
))
where id = 'education-revolution'
  -- run twice by accident and it still adds the link only once
  and not sources @> '[{"label": "מצע החינוך המלא ( 7 עמ׳ )"}]';

select public.system_change_publish();
commit;
