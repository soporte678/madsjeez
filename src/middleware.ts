import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
  touchAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session"
import { getSupabaseService } from "@/lib/supabase/service"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes except login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const response = NextResponse.next()
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !anon) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    const supabase = createServerClient(
      url,
      anon,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    const svc = getSupabaseService()

    // Check admin role
    const { data: adminUser } = await svc
      .from("admin_users")
      .select("id, is_active")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (!adminUser) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    const activeAdminSession = await verifyAdminSession({
      rawToken: adminSessionToken,
      adminUserId: adminUser.id,
      userId: session.user.id,
    })

    if (!activeAdminSession || !adminSessionToken) {
      await supabase.auth.signOut()
      const redirect = NextResponse.redirect(new URL("/admin/login", request.url))
      redirect.cookies.set(ADMIN_SESSION_COOKIE, "", {
        ...getAdminSessionCookieOptions(new Date(0)),
        maxAge: 0,
      })
      return redirect
    }

    const refreshedExpiry = await touchAdminSession(adminSessionToken)
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      adminSessionToken,
      getAdminSessionCookieOptions(refreshedExpiry)
    )

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
