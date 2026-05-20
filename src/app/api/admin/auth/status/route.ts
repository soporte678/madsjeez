import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getSupabaseService } from "@/lib/supabase/service"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
  touchAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session"

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anon) {
    return NextResponse.json({ authenticated: false }, { status: 503 })
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = []
  const response = NextResponse.json({ authenticated: false }, { status: 401 })

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          pendingCookies.push({ name, value, options: options ?? {} })
        )
      },
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const svc = getSupabaseService()
  const { data: adminUser } = await svc
    .from("admin_users")
    .select("id, is_active")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!adminUser) {
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const activeAdminSession = await verifyAdminSession({
    rawToken: adminToken,
    adminUserId: adminUser.id,
    userId: session.user.id,
  })

  if (!activeAdminSession) {
    pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    return response
  }

  const refreshedExpiry = await touchAdminSession(adminToken!)
  const okResponse = NextResponse.json({ authenticated: true })
  okResponse.cookies.set(
    ADMIN_SESSION_COOKIE,
    adminToken!,
    getAdminSessionCookieOptions(refreshedExpiry)
  )
  pendingCookies.forEach(({ name, value, options }) => okResponse.cookies.set(name, value, options))
  return okResponse
}
