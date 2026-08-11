// supabaseClient.ts - the single connection point to Supabase.
// The URL and anon key are PUBLIC by design (they ship inside the site's
// code); real protection comes from Row Level Security rules in the
// database itself (see supabase/schema.sql).
//
// Until the values below are filled in, the app runs in "offline mode":
// the quiz serves the baked-in content and the admin explains that the
// database is not connected yet.
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://wlvfvkvatxqrlhpwikeu.supabase.co'
export const SUPABASE_ANON_KEY = 'sb_publishable_1gYrRhnmfK5SL3OeR2m4tQ_15nz4HWC'

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null
