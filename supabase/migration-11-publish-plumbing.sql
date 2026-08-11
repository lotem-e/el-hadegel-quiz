-- Migration 11: two fixes to how publishing works.
--
-- (1) The admin used to decide "are there unpublished changes?" from a list
--     of fields maintained by hand in TypeScript, which had already fallen
--     behind (it ignored a category's order and the quiz settings). The
--     snapshot builder is now exposed on its own, so the admin can ask the
--     database what publishing WOULD produce and compare that - no list to
--     forget a field.
--
-- (2) Claude's migrations can now publish themselves, so content Lotem did
--     not author never sits waiting for her. They publish ONLY if her draft
--     was already fully published when the migration started; otherwise they
--     wait and ride along with her next publish, so her unfinished work is
--     never pushed live behind her back.
--
-- Run once in the Supabase SQL Editor.

-- ---------- the snapshot builder, split out of publish_content ----------
-- SECURITY INVOKER on purpose: row level security still applies, so even if
-- a grant were ever loosened, an anonymous caller could not read the private
-- draft through it.
create or replace function public.build_snapshot()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select jsonb_build_object(
    'pillars', (select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order), '[]'::jsonb) from public.pillars p),
    'questions', (select coalesce(jsonb_agg(to_jsonb(q) order by q.sort_order), '[]'::jsonb) from public.questions q),
    'config', (select to_jsonb(c) from public.quiz_config c where c.id)
  );
$$;

-- publish now has one job: store what the builder produced.
create or replace function public.publish_content()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.published_content (content) select public.build_snapshot();
$$;

-- ---------- is the draft already published? ----------
create or replace function public.draft_is_clean()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.build_snapshot() is not distinct from
         (select content from public.published_content order by published_at desc limit 1);
$$;

-- ---------- the envelope a system change wraps itself in ----------
-- begin() remembers whether her draft was clean; publish() acts on that.
create or replace function public.system_change_begin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.draft_was_clean', public.draft_is_clean()::text, true);
end;
$$;

create or replace function public.system_change_publish()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  was_clean text := current_setting('app.draft_was_clean', true);
begin
  -- Absent setting means the pair was split across transactions. Refuse
  -- rather than guess, so a half-run script can never publish her draft.
  if was_clean is null or was_clean = '' then
    raise exception 'system_change_publish() must run in the same transaction as system_change_begin()';
  end if;
  if was_clean = 'true' then
    perform public.publish_content();
    return 'published';
  end if;
  return 'deferred - הטיוטה שלך לא הייתה מפורסמת, השינוי יצא בפרסום הבא';
end;
$$;

-- ---------- privileges ----------
-- Supabase grants EXECUTE on every NEW function to anon by default, and
-- revoking from PUBLIC is not enough (verified exploitable in migration 3).
-- Every function here must be revoked from anon explicitly.
revoke all on function public.build_snapshot() from public, anon;
revoke all on function public.publish_content() from public, anon;
revoke all on function public.draft_is_clean() from public, anon;
revoke all on function public.system_change_begin() from public, anon;
revoke all on function public.system_change_publish() from public, anon;

grant execute on function public.build_snapshot() to authenticated;
grant execute on function public.publish_content() to authenticated;
grant execute on function public.draft_is_clean() to authenticated;
-- The envelope is for migrations run in the SQL editor (which runs as the
-- owner), so it needs no role grant at all.
