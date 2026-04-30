import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://doweovsukuskflgnxhhn.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_DmXmnt4V6A3tpwCq73ZIuA_a0dtWb0h"

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )
}

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (_supabase) return _supabase
  _supabase = createClient()
  return _supabase
}
