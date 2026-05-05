"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff4d2e] to-[#00b4d8] rounded-xl flex items-center justify-center shadow-lg shadow-[#ff4d2e]/20">
                <span className="text-white font-black text-xl">M</span>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-[#ff4d2e] via-[#ffb703] to-[#00b4d8] bg-clip-text text-transparent">
                MADSJEEZ
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/categories" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Categorías
            </Link>
            <Link href="/deals" className="text-sm font-medium text-white/80 hover:text-[#ff4d2e] transition-colors">
              Ofertas
            </Link>
            <Link href="/history" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Historial
            </Link>
            <Link href="/supermarket" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Supermercado
            </Link>
            <Link href="/fashion" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Moda
            </Link>
            <Link href="/sell" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Vender
            </Link>
            <Link href="/help" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
              Ayuda
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <Link href="/account" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Mi Cuenta
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
                    🛒
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/register" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Creá tu cuenta
                </Link>
                <Link href="/auth/login" className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  Ingresá
                </Link>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="text-white/80 hover:text-white hover:bg-white/10">
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
