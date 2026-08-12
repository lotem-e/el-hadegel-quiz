-- Migration 13 - the pin-flag threshold drops from 90 to 80 (Lotem's call,
-- 2026-08-11). The scoring maps "מסכים" to 75, so 90 demanded strong
-- agreement on most statements and flipped borderline supporters between
-- random draws; 80 keeps the bar above plain across-the-board agreement
-- while inviting the people it was meant for.
--
-- Config is content, so the envelope applies: publishes itself only if the
-- draft was already clean, otherwise rides with the next publish. Run the
-- whole file in ONE go.

begin;
select public.system_change_begin();

update public.quiz_config set pin_flag_threshold = 80 where id = true;

select public.system_change_publish();
commit;
