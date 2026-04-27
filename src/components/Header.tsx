"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-[#FEE500]">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-gray-800">
              MADSJEEZ
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/categories" className="text-sm font-medium hover:opacity-70">
              Categorías
            </Link>
            <Link href="/deals" className="text-sm font-medium hover:opacity-70">
              Ofertas
            </Link>
            <Link href="/history" className="text-sm font-medium hover:opacity-70">
              Historial
            </Link>
            <Link href="/supermarket" className="text-sm font-medium hover:opacity-70">
              Supermercado
            </Link>
            <Link href="/fashion" className="text-sm font-medium hover:opacity-70">
              Moda
            </Link>
            <Link href="/sell" className="text-sm font-medium hover:opacity-70">
              Vender
            </Link>
            <Link href="/help" className="text-sm font-medium hover:opacity-70">
              Ayuda
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link href="/account" className="text-sm font-medium hover:opacity-70">
                  Mi Cuenta
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon">
                    🛒
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="text-sm font-medium hover:opacity-70">
                  Creá tu cuenta
                </Link>
                <Link href="/auth/login" className="text-sm font-medium hover:opacity-70">
                  Ingresá
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon">
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
