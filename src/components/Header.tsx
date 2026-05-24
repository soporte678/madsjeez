"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { ShoppingCart } from "lucide-react"
import ThemeToneSwitcher from "@/components/theme/ThemeToneSwitcher"
import RainbowLogo from "@/components/brand/RainbowLogo"
import { useCartStore } from "@/stores/cartStore"

/** `user` es opcional por compatibilidad con páginas legacy; la cabecera usa `useSession()`. */
export type HeaderProps = {
  user?: { id: string; email?: string | null } | null;
};

export function Header(_props: HeaderProps = {}) {
  const { data: session } = useSession()
  const cartItemsCount = useCartStore((s) => s.getTotalItems())

  return (
    <header className="sticky top-0 z-50 bg-[var(--shell-header-bg)]/95 backdrop-blur-md border-b border-[var(--shell-header-border)] shadow-[var(--shadow-header)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-4 shrink-0">
            <RainbowLogo textSizeClassName="text-xl sm:text-2xl" />
          </div>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-6">
            <Link href="/categories" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Categorías
            </Link>
            <Link href="/deals" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-primary transition-colors">
              Ofertas
            </Link>
            <Link href="/history" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Historial
            </Link>
            <Link href="/supermarket" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors hidden xl:inline">
              Supermercado
            </Link>
            <Link href="/fashion" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors hidden xl:inline">
              Moda
            </Link>
            <Link href="/sell" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Vender
            </Link>
            <Link href="/help" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Ayuda
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <ThemeToneSwitcher compact />
            {session?.user ? (
              <Link
                href="/account"
                className="hidden sm:inline text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                Mi Cuenta
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className="hidden sm:inline text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Creá tu cuenta
                </Link>
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-primary hover:text-[var(--primary-hover)] transition-colors touch-target px-2"
                >
                  Ingresá
                </Link>
              </>
            )}
            <Link
              href="/cart"
              aria-label={`Carrito${cartItemsCount > 0 ? `, ${cartItemsCount} productos` : ""}`}
              className="touch-target relative rounded-full p-2 text-[var(--muted-foreground)] hover:text-primary hover:bg-primary/10 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {cartItemsCount > 99 ? "99+" : cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
