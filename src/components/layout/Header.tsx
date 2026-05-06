"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Search, ShoppingCart, Menu, User, Store, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useCartStore } from "@/stores/cartStore"

export function Header() {
  const { data: session } = useSession()
  const { getTotalItems } = useCartStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const cartItemsCount = getTotalItems()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white border-b border-border shadow-sm">
      {/* Barra superior */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent"></div>
                <svg viewBox="0 0 100 100" className="w-6 h-6 overflow-visible">
                  <path d="M 15 80 L 35 30 L 55 55" stroke="#2563EB" fill="none" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M 85 80 L 65 30 L 45 65" stroke="#3B82F6" fill="none" strokeWidth="15" strokeLinecap="round"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                MADS<span className="text-blue-600">JEEZ</span>
              </h1>
            </div>
          </Link>

          {/* Barra de búsqueda */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar productos, marcas y más..."
                className="w-full px-4 py-2 pr-12 rounded-sm border-none shadow-sm focus:ring-2 focus:ring-blue-500 text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-4 text-gray-400 hover:text-gray-600"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Navegación derecha */}
          <div className="flex items-center gap-4">
            {/* Categorías */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900">
                <Menu className="w-5 h-5" />
                Categorías
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Carrito */}
            <Link href="/cart" className="relative p-2 hover:bg-primary/10 rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </Link>

            {/* Usuario */}
            {session?.user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">{session.user.name || "Mi cuenta"}</span>
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg py-2 hidden group-hover:block z-50">
                  <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mi cuenta
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Mis compras
                  </Link>
                  {session.user.isSeller ? (
                    <Link href="/seller/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Panel de vendedor
                    </Link>
                  ) : (
                    <Link href="/seller/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Vender
                    </Link>
                  )}
                  <hr className="my-2" />
                  <button 
                    onClick={() => {/* signOut */}}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="text-sm text-gray-700 hover:text-gray-900">
                Ingresá
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                <span className="text-gray-500">Ubicación:</span> Capital Federal
              </span>
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/category/tecnologia" className="text-gray-600 hover:text-gray-900">Tecnología</Link>
                <Link href="/category/hogar" className="text-gray-600 hover:text-gray-900">Hogar</Link>
                <Link href="/category/deportes" className="text-gray-600 hover:text-gray-900">Deportes</Link>
                <Link href="/category/moda" className="text-gray-600 hover:text-gray-900">Moda</Link>
              </nav>
            </div>
            
            {!session?.user?.isSeller && (
              <Link 
                href="/seller/register" 
                className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
              >
                <Store className="w-4 h-4" />
                ¡Creá tu tienda gratis!
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
