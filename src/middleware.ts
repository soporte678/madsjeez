import { NextResponse, type NextRequest } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { getSupabaseService } from "@/lib/supabase/service"
import { getToken } from "next-auth/jwt"
import { isReservedStoreSlug } from "@/lib/stores/reserved-slugs"

const CANONICAL_HOST = "www.madsjeez.com.ar"

/**
 * Devuelve el label de un subdominio de tienda (nombre.madsjeez.com.ar) o null.
 * Edge-safe: sólo parseo de string + Set de reservados (sin Prisma/DB).
 */
function getTenantSubdomain(host: string): string | null {
  const h = host.toLowerCase().split(":")[0]
  const suffix = ".madsjeez.com.ar"
  if (!h.endsWith(suffix)) return null
  const label = h.slice(0, -suffix.length)
  if (!label || label === "www" || label.includes(".")) return null
  if (isReservedStoreSlug(label)) return null
  return label
}

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
  // ── CSP nonce — generated per-request so inline scripts never need unsafe-inline ──
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://www.googletagmanager.com https://connect.facebook.net https://*.mercadopago.com`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' https://fonts.gstatic.com`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://*.googletagmanager.com https://*.mercadopago.com`,
    `frame-src 'self' https://*.mercadopago.com https://*.stripe.com`,
    `media-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ")

  // Forward nonce to route handlers / server components via request header
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)

  /** Apply CSP + isolation headers to any NextResponse. */
  function applySecHeaders(res: NextResponse): NextResponse {
    res.headers.set("Content-Security-Policy", cspHeader)
    res.headers.set("Cross-Origin-Opener-Policy", "same-origin")
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin")
    res.headers.set("Cross-Origin-Embedder-Policy", "credentialless")
    res.headers.set("X-Content-Type-Options", "nosniff")
    res.headers.set("X-Frame-Options", "DENY")
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    return res
  }

  // ── Tiendas por subdominio: nombre.madsjeez.com.ar ──────────────────────
  // Debe ir ANTES del redirect canónico (que mandaría todo a www).
  const sub = getTenantSubdomain(request.headers.get("host") ?? "")
  if (sub) {
    const url = request.nextUrl.clone()
    const p = url.pathname
    if (p === "/" || p === "") {
      // El root del subdominio renderiza la tienda (rewrite interno, sin cambiar la URL).
      url.pathname = `/tienda/${sub}`
      return applySecHeaders(NextResponse.rewrite(url, { request: { headers: requestHeaders } }))
    }
    // Rutas con sentido en el subdominio (tienda, producto, API, assets) pasan;
    // el resto del marketplace vive en www → redirigimos preservando el path.
    if (
      p.startsWith("/tienda/") || p.startsWith("/product/") ||
      p.startsWith("/api/") || p.startsWith("/_next/")
    ) {
      return applySecHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
    }
    url.host = CANONICAL_HOST
    url.protocol = "https"
    return applySecHeaders(NextResponse.redirect(url, 307))
  }

  const hostRedirect = canonicalHostRedirect(request)
  if (hostRedirect) return applySecHeaders(hostRedirect)

  const { pathname } = request.nextUrl

  // Protect driver routes — chofer activo en DB (JWT isDriver puede quedar viejo tras aprobación admin)
  if (pathname.startsWith("/driver") && !pathname.startsWith("/driver/login")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (!token?.id) {
      return applySecHeaders(NextResponse.redirect(new URL("/driver/login", request.url)))
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
      return applySecHeaders(NextResponse.redirect(url))
    }
  }

  // Only protect admin routes except login
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const response = NextResponse.next({ request: { headers: requestHeaders } })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !anon) {
      return applySecHeaders(NextResponse.redirect(new URL("/admin/login", request.url)))
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
      return applySecHeaders(NextResponse.redirect(new URL("/admin/login", request.url)))
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
      return applySecHeaders(NextResponse.redirect(new URL("/admin/login", request.url)))
    }

    return applySecHeaders(response)
  }

  // Protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
      return applySecHeaders(NextResponse.redirect(new URL("/auth/login", request.url)))
    }
  }

  /* ================================================================ */
  /* JARVIS EDGE CACHING — Sub-50ms responses for cached queries      */
  /* ================================================================ */

  const isJarvisApi = pathname.startsWith("/api/jarvis");
  const isJarvisStream = pathname.startsWith("/api/jarvis/stream");
  const isDestructiveCommand = /\b(create-agent-task|orchestrate|dispatch)\b/.test(
    request.nextUrl.search
  );

  if (isJarvisApi && !isJarvisStream && !isDestructiveCommand) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });

    // Enable stale-while-revalidate for safe JARVIS endpoints
    // Cache in CDN edge for 30s (health checks, status, etc.)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=30, stale-while-revalidate=60"
    );

    // Add performance headers
    response.headers.set("X-Jarvis-Cache", "edge-enabled");
    response.headers.set("X-Jarvis-Edge-TTL", "30");

    // Add cache tags for selective invalidation
    const scope = request.nextUrl.searchParams.get("scope") ?? "all";
    response.headers.set("Cache-Tag", `jarvis,${scope}`);

    return applySecHeaders(response);
  }

  // Streaming endpoint: never cache, but add performance hints
  if (isJarvisStream) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-Accel-Buffering", "no");
    response.headers.set("Cache-Control", "no-cache, no-store");
    return applySecHeaders(response);
  }

  // Destructive JARVIS commands: bypass all caching
  if (isJarvisApi && isDestructiveCommand) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    response.headers.set("X-Jarvis-Cache", "bypass-destructive");
    return applySecHeaders(response);
  }

  return applySecHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)).*)",
  ],
}
