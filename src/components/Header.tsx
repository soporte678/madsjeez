"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[#3483FA]">
          MADSJEEZ
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm hover:text-[#3483FA]">
            Productos
          </Link>
          <Link href="/search" className="text-sm hover:text-[#3483FA]">
            Buscar
          </Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="text-sm hover:text-[#3483FA]">
                Mi Cuenta
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Ingresar</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-[#3483FA]">Crear cuenta</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
