"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, Ticket, Clock, ChevronDown, Filter, Tag, Percent, Sparkles, Copy, Check, Store } from "lucide-react"
import { cn } from "@/lib/utils"

interface Coupon {
  id: string
  code: string
  title: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  minPurchase: number
  maxDiscount: number
  expiresAt: string
  store: {
    name: string
    logo: string
    reputation: string
  }
  category: string
  categorySlug: string
  productCount: number
  isDemo?: boolean
  isEnding?: boolean
  isUrgent?: boolean
}

interface CategoryGroup {
  name: string
  slug: string
  coupons: Coupon[]
}

export default function PublicCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [groupedByCategory, setGroupedByCategory] = useState<CategoryGroup[]>([])
  const [categories, setCategories] = useState<{name: string, slug: string, count: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showSearch, setShowSearch] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    loadCoupons(searchQuery)
  }, [activeTab])

  const loadCoupons = async (query = searchQuery) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set("search", query.trim())
      params.set("tab", activeTab)
      
      const response = await fetch(`/api/coupons/public?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
        setGroupedByCategory(data.groupedByCategory || [])
        setCategories(data.stats?.categories || [])
      }
    } catch (error) {
      console.error("Error loading coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadCoupons(searchQuery)
  }

  const resetSearch = () => {
    setShowSearch(false)
    setSearchQuery("")
    loadCoupons("")
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      {/* Header amarillo */}
      <header className="bg-gradient-to-r from-[#ffb703] via-[#ffa60a] to-[#ffb703]">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 100 100" className="w-6 h-6">
                  <path d="M 15 80 L 35 30 L 55 55" stroke="#ff4d2e" fill="none" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M 85 80 L 65 30 L 45 65" stroke="#00b4d8" fill="none" strokeWidth="15" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-black text-xl tracking-tighter text-[#2d3277]">MADSJEEZ</span>
            </Link>
            <span className="text-slate-600">|</span>
            <h1 className="text-lg font-medium text-slate-800">Cupones</h1>
          </div>
        </div>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-[1200px] mx-auto px-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar cupones por tienda, categoría o descuento..."
                  className="w-full px-4 py-2 pl-10 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3483FA]/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button type="submit" className="bg-[#3483FA] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2968C8] transition-colors">
                Buscar
              </button>
              <button type="button" onClick={resetSearch} className="px-4 py-2 text-slate-600">
                Cancelar
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#3483FA]" />
              Buscando solo en la sección de Cupones ({coupons.length} cupones disponibles)
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Cupones</h2>
            <p className="text-slate-600 text-sm">{coupons.length} cupones disponibles para tus compras</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="text-[#3483FA] text-sm hover:underline">
              {showSearch ? "Ocultar búsqueda" : "Buscar cupón"}
            </button>
            <span className="text-slate-300">|</span>
            <button className="text-[#3483FA] text-sm hover:underline">Cómo usar cupones</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex flex-wrap">
            {[
              { id: "all", label: "Mis cupones", count: coupons.length },
              { id: "categories", label: "Categorías", count: categories.length },
              { id: "ending", label: "Terminan hoy", count: coupons.filter(c => c.isEnding).length },
              { id: "most-used", label: "Más usados", count: null },
              { id: "new", label: "Nuevos", count: null }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-[#3483FA] text-[#3483FA] bg-[#3483FA]/5"
                    : "border-transparent text-slate-600 hover:bg-slate-50"
                )}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1 text-xs text-slate-400">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-800">{coupons.length}</span> cupones
          </p>
          <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#3483FA] bg-white px-3 py-1.5 rounded-lg shadow-sm">
            <Filter className="w-4 h-4" />
            Filtrar y ordenar
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Coupons by category */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByCategory.length > 0 ? (
              groupedByCategory.map((group) => (
                <section key={group.slug} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{group.name}</h3>
                    {group.coupons.length > 3 && (
                      <Link href="#" className="text-[#3483FA] text-sm hover:underline">
                        Ver {group.coupons.length - 3} cupones más
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.coupons.slice(0, 3).map((coupon) => (
                      <CouponCard key={coupon.id} coupon={coupon} copiedCode={copiedCode} onCopy={copyCode} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Ticket className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 text-lg">No encontramos cupones con esos filtros</p>
              </div>
            )}

            {/* Demo notice */}
            {coupons.some(c => c.isDemo) && (
              <div className="p-4 bg-[#ffb703]/20 rounded-lg border border-[#ffb703]/30">
                <p className="text-sm text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff4d2e]" />
                  <span>
                    Mostrando cupones de ejemplo. ¡Los vendedores pueden crear sus propios cupones para atraer más clientes!
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Ver todos button */}
        <button className="w-full mt-6 bg-[#3483FA] text-white py-3 rounded-lg font-medium hover:bg-[#2968C8] transition-colors">
          Ver todos los cupones
        </button>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link href="/about" className="hover:text-[#3483FA]">Trabajá con nosotros</Link>
            <Link href="/legal/terminos" className="hover:text-[#3483FA]">Términos y condiciones</Link>
            <Link href="/promotions" className="hover:text-[#3483FA]">Promociones</Link>
            <Link href="/help" className="hover:text-[#3483FA]">Ayuda</Link>
          </div>
          <div className="text-center mt-4 text-xs text-slate-400">
            Copyright © 2026 MadsJeez Commerce Group S.R.L.
          </div>
        </div>
      </footer>
    </div>
  )
}

function CouponCard({ coupon, copiedCode, onCopy }: { coupon: Coupon; copiedCode: string | null; onCopy: (code: string) => void }) {
  const formatCurrency = (amount: number) => "$" + amount.toLocaleString("es-AR")
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 0) return "¡Vence hoy!"
    if (diffDays === 1) return "Vence mañana"
    if (diffDays <= 7) return `Vence en ${diffDays} días`
    return `Vence el ${date.toLocaleDateString("es-AR")}`
  }

  const displayValue = coupon.discountType === "percentage" 
    ? `${coupon.discountValue}% OFF`
    : `${formatCurrency(coupon.discountValue)} OFF`

  return (
    <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white relative overflow-hidden">
      {/* Decorative notches */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#EBEBEB] rounded-full" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-[#EBEBEB] rounded-full" />
      
      <div className="flex items-start gap-3 mb-3">
        <img 
          src={coupon.store.logo} 
          alt={coupon.store.name}
          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-800 text-sm truncate">
            {displayValue} {coupon.store.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{coupon.description}</p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded">
        <p>Compra mínima {formatCurrency(coupon.minPurchase)}</p>
        <p>Tope de {formatCurrency(coupon.maxDiscount)}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span className={cn(
            coupon.isUrgent && "text-orange-500 font-medium",
            coupon.isEnding && !coupon.isUrgent && "text-orange-400"
          )}>
            {formatDate(coupon.expiresAt)}
          </span>
        </div>
        
        {/* Code display with copy */}
        <div className="flex items-center gap-2">
          <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-700">
            {coupon.code}
          </code>
          <button 
            onClick={() => onCopy(coupon.code)}
            className="p-1.5 text-[#3483FA] hover:bg-[#3483FA]/10 rounded transition-colors"
            title="Copiar código"
          >
            {copiedCode === coupon.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {coupon.isEnding && (
        <p className="text-xs text-orange-500 mt-2 font-medium">¡Por agotarse!</p>
      )}
    </div>
  )
}