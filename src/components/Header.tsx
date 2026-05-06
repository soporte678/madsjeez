"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import ThemeToneSwitcher from "@/components/theme/ThemeToneSwitcher"
import RainbowLogo from "@/components/brand/RainbowLogo"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-[var(--shell-header-bg)] border-b border-[var(--shell-header-border)]">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <RainbowLogo textSizeClassName="text-2xl" />
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/categories" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Categorías
            </Link>
            <Link href="/deals" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-primary transition-colors">
              Ofertas
            </Link>
            <Link href="/history" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Historial
            </Link>
            <Link href="/supermarket" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Supermercado
            </Link>
            <Link href="/fashion" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Moda
            </Link>
            <Link href="/sell" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Vender
            </Link>
            <Link href="/help" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              Ayuda
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToneSwitcher compact />
            {session?.user ? (
              <>
                <Link href="/account" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  Mi Cuenta
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-secondary/70">
                    🛒
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  Creá tu cuenta
                </Link>
                <Link href="/auth/login" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                  Ingresá
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-secondary/70">
                    🛒
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
