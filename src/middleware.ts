import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getSupabaseService } from "@/lib/supabase/service"
import { getToken } from "next-auth/jwt"

const CANONICAL_HOST = "www.madsjeez.com.ar"

/** Un solo salto apex → www (evita cadenas de redirección en auditorías SEO). */
function canonicalHostRedirect(request: NextRequest): NextResponse | null {
  const host = request.headers.get("host") ?? ""
  if (!host.endsWith("madsjeez.com.ar") || host === CANONICAL_HOST) {
    return null
  }
  const url = request.nextUrl.clone()
  url.host = CANONICAL_HOST
  url.protocol = "https"
  return NextResponse.redirect(url, 308)
}

export async function middleware(request: NextRequest) {
  const hostRedirect = canonicalHostRedirect(request)
  if (hostRedirect) return hostRedirect

  const { pathname } = request.nextUrl

  // Protect driver routes — chofer activo en DB (JWT isDriver puede quedar viejo tras aprobación admin)
  if (pathname.startsWith("/driver") && !pathname.startsWith("/driver/login")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.id) {
      return NextResponse.redirect(new URL("/driver/login", request.url))
    }

    let isDriver = Boolean(token.isDriver)
    if (!isDriver) {
      try {
        const verifyUrl = new URL("/api/flash/drivers/session-verify", request.url)
        const res = await fetch(verifyUrl, {
          headers: { cookie: request.headers.get("cookie") ?? "" },
          cache: "no-store",
        })
        if (res.ok) {
          const data = (await res.json()) as { isDriver?: boolean }
          isDriver = Boolean(data.isDriver)
        }
      } catch {
        isDriver = false
      }
    }

    if (!isDriver) {
      const url = new URL("/driver/login", request.url)
      url.searchParams.set("error", "not_driver")
      return NextResponse.redirect(url)
    }
  }

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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    const svc = getSupabaseService()

    const { data: adminUser } = await svc
      .from("admin_users")
      .select("is_active")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    if (!adminUser) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)).*)",
  ],
}
