-- Migration 2: draft/publish flow.
-- Admin edits stay a private DRAFT; clicking "publish" snapshots the draft
-- into published_content, which is the only thing visitors read. Every
-- publish is a new row = free version history.
-- Run once in the Supabase SQL Editor.

-- 1) Published snapshots (append-only history)
create table public.published_content (
  id bigint generated always as identity primary key,
  published_at timestamptz not null default now(),
  content jsonb not null
);
alter table public.published_content enable row level security;
create policy "public read published" on public.published_content
  for select using (true);
create policy "admin insert published" on public.published_content
  for insert to authenticated with check (true);

-- 2) The publish action: build the snapshot server-side, atomically
create or replace function public.publish_content()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.published_content (content)
  select jsonb_build_object(
    'pillars', (select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order), '[]'::jsonb) from public.pillars p),
    'questions', (select coalesce(jsonb_agg(to_jsonb(q) order by q.sort_order), '[]'::jsonb) from public.questions q),
    'config', (select to_jsonb(c) from public.quiz_config c where c.id)
  );
$$;
revoke all on function public.publish_content() from public;
grant execute on function public.publish_content() to authenticated;

-- 3) Drafts become private: only the signed-in admin reads them
drop policy "public read pillars" on public.pillars;
drop policy "public read questions" on public.questions;
drop policy "public read config" on public.quiz_config;
create policy "admin read pillars" on public.pillars
  for select to authenticated using (true);
create policy "admin read questions" on public.questions
  for select to authenticated using (true);
create policy "admin read config" on public.quiz_config
  for select to authenticated using (true);

-- 4) First publish: snapshot the current state right now, so the site has
--    content the moment the new code goes live
select public.publish_content();
