import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://doweovsukuskflgnxhhn.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTkyNzEsImV4cCI6MjA5Mjc5NTI3MX0.a0H7VrFwHWZavy8L0DjUyoAecQAdEf22UsA-a0p0u4Y"

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
