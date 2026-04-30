import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  // Use hardcoded values - Next.js inlines NEXT_PUBLIC_* as undefined during Docker builds
  const url = "https://doweovsukuskflgnxhhn.supabase.co"
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2VvdnN1a3Vza2ZsZ254aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTkyNzEsImV4cCI6MjA5Mjc5NTI3MX0.a0H7VrFwHWZavy8L0DjUyoAecQAdEf22UsA-a0p0u4Y"

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
