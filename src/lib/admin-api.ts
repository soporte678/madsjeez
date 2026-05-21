import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { getSupabaseService } from "@/lib/supabase/service"
import {
  ADMIN_SESSION_COOKIE,
  getAdminSessionCookieOptions,
  touchAdminSession,
  verifyAdminSession,
} from "@/lib/admin-session"

type PendingCookie = { name: string; value: string; options: CookieOptions }

export interface AdminRequestContext {
  service: SupabaseClient
  auth: SupabaseClient
  user: User
  adminUser: {
    id: string
    user_id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    role_id?: string | null
    is_active?: boolean | null
  }
  response: NextResponse
}

function withPendingCookies(
  response: NextResponse,
  pendingCookies: PendingCookie[]
) {
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  )
  return response
}

/** ID del actor en auditorías (usuario Supabase Auth del admin). */
export function adminActorId(ctx: AdminRequestContext): string {
  return ctx.adminUser.user_id
}

/** Respuesta JSON propagando cookies de sesión admin (refresh de ADMIN_SESSION). */
export function adminJson<T>(
  ctx: AdminRequestContext,
  body: T,
  init?: ResponseInit
): NextResponse {
  const res = NextResponse.json(body, init)
  ctx.response.cookies.getAll().forEach((c) => res.cookies.set(c))
  return res
}

/** Única fuente de verdad: fila activa en `admin_users` (por email). */
export async function isMarketplaceAdminEmail(
  email: string | null | undefined
): Promise<boolean> {
  if (!email?.trim()) return false
  try {
    const svc = getSupabaseService()
    const { data } = await svc
      .from("admin_users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .eq("is_active", true)
      .maybeSingle()
    return Boolean(data?.id)
  } catch {
    return false
  }
}

export async function requireAdminRequest(
  request: NextRequest
): Promise<AdminRequestContext | NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !anon) {
    return NextResponse.json(
      { error: "Supabase no configurado en el servidor." },
      { status: 503 }
    )
  }

  const pendingCookies: PendingCookie[] = []
  const auth = createServerClient(url, anon, {
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
    data: { user },
    error: userError,
  } = await auth.auth.getUser()

  if (userError || !user) {
    return withPendingCookies(
      NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      pendingCookies
    )
  }

  const service = getSupabaseService()
  const { data: adminUser } = await service
    .from("admin_users")
    .select("id, user_id, email, first_name, last_name, role_id, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle()

  if (!adminUser) {
    return withPendingCookies(
      NextResponse.json({ error: "Sin permisos de administrador" }, { status: 403 }),
      pendingCookies
    )
  }

  const adminToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const activeAdminSession = await verifyAdminSession({
    rawToken: adminToken,
    adminUserId: adminUser.id,
    userId: user.id,
  })

  if (!activeAdminSession || !adminToken) {
    return withPendingCookies(
      NextResponse.json({ error: "Sesion administrativa invalida" }, { status: 401 }),
      pendingCookies
    )
  }

  const refreshedExpiry = await touchAdminSession(adminToken)
  const response = NextResponse.next()
  response.cookies.set(
    ADMIN_SESSION_COOKIE,
    adminToken,
    getAdminSessionCookieOptions(refreshedExpiry)
  )

  withPendingCookies(response, pendingCookies)

  return {
    service,
    auth,
    user,
    adminUser,
    response,
  }
}

/** Mismo criterio que requireAdminRequest; null si no es admin (sin error HTTP). */
export async function tryAdminRequest(
  request: NextRequest
): Promise<AdminRequestContext | null> {
  const result = await requireAdminRequest(request)
  if (result instanceof NextResponse) return null
  return result
}
