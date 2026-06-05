"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  ShoppingCart,
  Menu,
  User,
  Store,
  ChevronDown,
  Grid3X3,
  Tag,
  Percent,
  HelpCircle,
  LayoutGrid,
  Sparkles,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";
import RainbowLogo from "@/components/brand/RainbowLogo";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const CATEGORY_LINKS = [
  { href: "/category/celulares-y-telefonia", label: "Celulares" },
  { href: "/category/computacion", label: "Computación" },
  { href: "/category/electronica-audio-y-video", label: "Electrónica" },
  { href: "/category/hogar-muebles-y-jardin", label: "Hogar" },
  { href: "/category/deportes-y-fitness", label: "Deportes" },
  { href: "/category/ropa-y-accesorios", label: "Moda" },
  { href: "/category/bebes", label: "Bebés" },
  { href: "/category/alimentos-y-bebidas", label: "Alimentos" },
];

const NAV_MORE = [
  { href: "/categories", label: "Todas las categorías", icon: LayoutGrid },
  { href: "/offers", label: "Ofertas del día", icon: Percent },
  { href: "/deals", label: "Descuentos", icon: Tag },
  { href: "/coupons/public", label: "Cupones", icon: Sparkles },
  { href: "/search", label: "Catálogo completo", icon: Search },
  { href: "/subscriptions", label: "Planes MADS+", icon: Sparkles },
  { href: "/help", label: "Ayuda y contacto", icon: HelpCircle },
];

export function Header() {
  const { data: session } = useSession();

  // El nombre/email del JWT de NextAuth se cachea hasta el siguiente login.
  // Para que los cambios de perfil aparezcan inmediatamente en el header,
  // pedimos los datos frescos a /api/user/me (lee de DB).
  const [liveProfile, setLiveProfile] = useState<{ name?: string | null; image?: string | null } | null>(null);
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch("/api/user/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.email) setLiveProfile({ name: data.name, image: data.image });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user?.id]);
  const headerUserName = liveProfile?.name || session?.user?.name || "Mi cuenta";
  const { getTotalItems } = useCartStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const cartItemsCount = getTotalItems();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/", redirect: false });
    } catch (e) {
      console.error("next-auth signOut error:", e);
    }

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("supabase signOut error:", e);
    }

    window.location.replace("/");
  };

  return (
    <header className="bg-white border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="flex-shrink-0">
            <RainbowLogo textSizeClassName="text-2xl" />
          </div>

          <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-2xl order-3 md:order-none w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos, marcas y más..."
                className="w-full px-4 py-2 pr-12 rounded-sm border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2 md:gap-4 ml-auto">
            {/* Menú Categorías con submenú real */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 py-2"
                aria-expanded="false"
                aria-haspopup="true"
              >
                <Menu className="w-5 h-5" />
                <span className="hidden sm:inline">Categorías</span>
                <ChevronDown className="w-4 h-4 hidden sm:inline" />
              </button>
              <div className="absolute left-0 top-full z-[60] pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[280px] max-w-[min(100vw-2rem,360px)]">
                <div className="bg-white rounded-lg shadow-xl border border-gray-200 py-2 max-h-[min(70vh,420px)] overflow-y-auto">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Explorar
                  </p>
                  {NAV_MORE.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                      {item.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-gray-100" />
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Categorías populares
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 px-1 pb-1">
                    {CATEGORY_LINKS.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="px-2 py-1.5 text-[13px] text-gray-700 hover:bg-slate-50 rounded-md"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-3 py-2 mt-1">
                    <Link
                      href="/categories"
                      className="text-sm font-semibold text-[#3483FA] hover:underline inline-flex items-center gap-1"
                    >
                      <Grid3X3 className="w-4 h-4" />
                      Ver árbol completo de categorías
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/cart" className="relative p-2 hover:bg-primary/10 rounded-full transition-colors" aria-label="Carrito">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {session?.user ? (
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 py-2"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline max-w-[140px] truncate">
                    {headerUserName}
                  </span>
                  <ChevronDown className="w-4 h-4 hidden md:inline" />
                </button>

                <div className="absolute right-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible z-[60] min-w-[220px]">
                  <div className="bg-white rounded-md shadow-xl border border-gray-200 py-2">
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mi cuenta
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Mis compras
                    </Link>
                    <Link
                      href="/notifications"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Notificaciones
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Favoritos
                    </Link>
                    {session.user.isSeller ? (
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Panel de vendedor
                      </Link>
                    ) : (
                      <Link
                        href="/seller/register"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Empezar a vender
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <Link href="/auth/register" className="text-gray-700 hover:text-gray-900 hidden sm:inline">
                  Creá tu cuenta
                </Link>
                <Link href="/auth/login" className="font-medium text-[#3483FA] hover:underline">
                  Ingresá
                </Link>
              </div>
            )}

            <button
              type="button"
              className="md:hidden p-2 rounded-md border border-gray-200 text-gray-700"
              onClick={() => setMobileNavOpen((o) => !o)}
              aria-expanded={mobileNavOpen}
              aria-label={mobileNavOpen ? "Cerrar menú" : "Abrir menú de secciones"}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Barra inferior — más opciones + scroll en móvil */}
      <div className="border-t border-border bg-slate-50/80">
        <div className="container mx-auto px-4 py-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
              <span className="hidden sm:inline">Envíos a</span>
              <span className="font-medium text-gray-700">Capital Federal</span>
            </div>

            <nav
              className={`${mobileNavOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row md:flex-wrap md:items-center gap-x-1 gap-y-1 md:gap-x-4 text-sm overflow-x-auto pb-1 md:pb-0 scrollbar-hide`}
            >
              {NAV_MORE.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-gray-600 hover:text-[#3483FA] whitespace-nowrap py-1 md:py-0"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <span className="hidden md:inline text-gray-300">|</span>
              {CATEGORY_LINKS.slice(0, 6).map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="text-gray-600 hover:text-[#3483FA] whitespace-nowrap hidden lg:inline"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {c.label}
                </Link>
              ))}
            </nav>

            {!session?.user?.isSeller && (
              <Link
                href="/seller/register"
                className="flex items-center gap-1 text-[#3483FA] font-semibold text-sm shrink-0 hover:underline"
              >
                <Store className="w-4 h-4" />
                ¡Creá tu tienda gratis!
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
