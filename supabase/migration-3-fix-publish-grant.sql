-- Fix: block anonymous publishing.
-- Supabase's default privileges grant EXECUTE on new functions to the anon
-- role directly, so revoking from PUBLIC (migration 2) was not enough.
-- Verified exploitable before this fix: an anonymous REST call to
-- rpc/publish_content returned 204 and created a snapshot.
revoke execute on function public.publish_content() from anon;
grant execute on function public.publish_content() to authenticated;

-- Remove the two snapshots created while probing the hole (identical
-- copies of snapshot 1, no content loss).
delete from public.published_content where id in (2, 3);
