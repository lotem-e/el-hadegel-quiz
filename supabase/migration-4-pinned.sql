-- Migration 4: pinned questions.
-- A pinned question is guaranteed a slot in every quiz (within its
-- pillar's quota). Run once in the Supabase SQL Editor.
alter table public.questions add column pinned boolean not null default false;
