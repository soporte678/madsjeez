import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabaseService } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  getAdminSessionCookieOptions,
  getRequestIp,
} from "@/lib/admin-session";

function applyPendingCookies(
  res: NextResponse,
  pending: { name: string; value: string; options: CookieOptions }[]
) {
  pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
}

/**
 * Login admin: sesión Supabase en servidor (env en runtime) + chequeo admin con service role (sin RLS circular).
 */
export async function POST(request: NextRequest) {
  // Rate limiting: max 5 intentos por IP cada 10 minutos
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  const { allowed, retryAfter } = rateLimit(`admin-signin:${ip}`, 5, 10 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Intenta de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.json(
      { error: "Supabase no configurado en el servidor (URL / anon key)." },
      { status: 503 }
    );
  }

  let parsed: { email?: string; password?: string };
  try {
    parsed = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = typeof parsed.email === "string" ? parsed.email.trim() : "";
  const password = typeof parsed.password === "string" ? parsed.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          pendingCookies.push({ name, value, options: options ?? {} })
        );
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    const res = NextResponse.json(
      { error: authError?.message ?? "Credenciales inválidas" },
      { status: 401 }
    );
    applyPendingCookies(res, pendingCookies);
    return res;
  }

  let svc;
  try {
    svc = getSupabaseService();
  } catch {
    await supabase.auth.signOut();
    const res = NextResponse.json(
      {
        error:
          "Servidor sin SUPABASE_SERVICE_ROLE_KEY. Configuralo para validar acceso admin.",
      },
      { status: 503 }
    );
    applyPendingCookies(res, pendingCookies);
    return res;
  }

  const { data: adminUser, error: adminErr } = await svc
    .from("admin_users")
    .select("id, email, first_name, last_name, role_id")
    .eq("user_id", authData.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminErr || !adminUser) {
    await supabase.auth.signOut();
    const res = NextResponse.json(
      { error: "No tienes permisos para acceder al panel de administracion" },
      { status: 403 }
    );
    applyPendingCookies(res, pendingCookies);
    return res;
  }

  const adminSession = await createAdminSession({
    adminUserId: adminUser.id,
    userId: authData.user.id,
    email: adminUser.email,
    userAgent: request.headers.get("user-agent"),
    ipAddress: getRequestIp(request.headers),
  });

  if (!adminSession.ok) {
    await supabase.auth.signOut();
    const res = NextResponse.json(
      {
        error:
          "Ya hay una sesion activa para este administrador. Cierra esa sesion antes de volver a ingresar.",
      },
      { status: 409 }
    );
    applyPendingCookies(res, pendingCookies);
    return res;
  }

  const res = NextResponse.json({
    ok: true,
    admin: {
      id: adminUser.id,
      email: adminUser.email,
      first_name: adminUser.first_name,
      last_name: adminUser.last_name,
    },
  });
  res.cookies.set(
    ADMIN_SESSION_COOKIE,
    adminSession.rawToken,
    getAdminSessionCookieOptions(adminSession.expiresAt)
  );
  applyPendingCookies(res, pendingCookies);
  return res;
}
