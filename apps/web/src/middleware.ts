import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/callback",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/product",
  "/category",
  "/search",
  "/legal",
  "/help",
];

// Rutas que requieren rol de vendedor
const sellerRoutes = [
  "/dashboard",
  "/products/new",
  "/products/edit",
  "/orders/sales",
  "/subscriptions",
  "/analytics",
];

// Rutas que requieren rol de admin
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Crear cliente de Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  // Obtener sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si hay sesión, obtener perfil para verificar rol
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const userRole = profile?.role || "buyer";

    // Verificar rutas de vendedor
    const isSellerRoute = sellerRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isSellerRoute && userRole === "buyer") {
      // Redirigir a página para convertirse en vendedor
      return NextResponse.redirect(new URL("/become-seller", request.url));
    }

    // Verificar rutas de admin
    const isAdminRoute = adminRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isAdminRoute && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Si está en login/register pero ya tiene sesión, redirigir a home
    if (pathname === "/auth/login" || pathname === "/auth/register") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
