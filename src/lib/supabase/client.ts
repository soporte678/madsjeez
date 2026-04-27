import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (_supabase) return _supabase
  _supabase = createClient()
  return _supabase
}
