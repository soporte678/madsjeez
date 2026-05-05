import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase browser client."
    )
  }
  return createBrowserClient(url, key)
}

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (_supabase) return _supabase
  _supabase = createClient()
  return _supabase
}
