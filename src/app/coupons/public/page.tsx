"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Search, Ticket, Clock, ChevronDown, Filter, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import RainbowLogo from "@/components/brand/RainbowLogo"

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
  const [categories, setCategories] = useState<{ name: string; slug: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    loadCoupons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
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
    loadCoupons()
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header de marca (consistente con el sitio) */}
      <header className="bg-gradient-to-r from-[#ffb703] via-[#ffa60a] to-[#ffb703]">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <RainbowLogo href="/" textSizeClassName="text-xl" iconSizeClassName="w-9 h-9" wordmarkColor="#1a1a2e" />
            <span className="text-[#1a1a2e]/40">|</span>
            <span className="text-lg font-medium text-[#1a1a2e]">Cupones</span>
          </div>
        </div>
      </header>

      {/* Search bar */}
      {showSearch && (
        <div className="bg-card border-b border-border py-3">
          <div className="max-w-[1200px] mx-auto px-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar cupones por tienda, categoría o descuento..."
                  className="w-full px-4 py-2 pl-10 bg-muted text-foreground placeholder:text-muted-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3483FA]/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <button type="submit" className="bg-[#3483FA] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#2968C8] transition-colors">
                Buscar
              </button>
              <button type="button" onClick={() => { setShowSearch(false); setSearchQuery(""); loadCoupons(); }} className="px-4 py-2 text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#3483FA]" />
              Buscando solo en la sección de Cupones ({coupons.length} cupones disponibles)
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cupones</h1>
            <p className="text-muted-foreground text-sm">{coupons.length} cupones disponibles para tus compras</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(!showSearch)} className="text-[#3483FA] text-sm font-semibold hover:underline">
              {showSearch ? "Ocultar búsqueda" : "Ingresar código"}
            </button>
            <span className="text-border">|</span>
            <Link href="/coupons/promociones" className="text-[#3483FA] text-sm font-semibold hover:underline">Promociones del mes</Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex flex-wrap">
            {[
              { id: "all", label: "Mis cupones", count: coupons.length },
              { id: "categories", label: "Categorías", count: categories.length },
              { id: "ending", label: "Terminan hoy", count: coupons.filter((c) => c.isEnding).length },
              { id: "most-used", label: "Más usados", count: null },
              { id: "new", label: "Nuevos", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-colors border-b-2",
                  activeTab === tab.id
                    ? "border-[#3483FA] text-[#3483FA] bg-[#3483FA]/10"
                    : "border-transparent text-muted-foreground hover:bg-muted/60"
                )}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{coupons.length}</span> cupones
          </p>
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#3483FA] bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <Filter className="w-4 h-4" />
            Filtrar y ordenar
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Coupons by category */}
        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-lg shadow-sm p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-4 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-32 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByCategory.length > 0 ? (
              groupedByCategory.map((group) => (
                <section key={group.slug} className="bg-card border border-border rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
                    {group.coupons.length > 3 && (
                      <span className="text-[#3483FA] text-sm">{group.coupons.length - 3} cupones más</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.coupons.slice(0, 3).map((coupon) => (
                      <CouponCard key={coupon.id} coupon={coupon} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="bg-card border border-border rounded-lg shadow-sm p-12 text-center">
                <Ticket className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground text-lg font-semibold">No encontramos cupones con esos filtros</p>
                <p className="text-muted-foreground text-sm mt-1">Probá con otra categoría o volvé más tarde: los vendedores publican nuevos cupones cada mes.</p>
              </div>
            )}

            {coupons.some((c) => c.isDemo) && (
              <div className="p-4 bg-[#ffb703]/15 rounded-lg border border-[#ffb703]/30">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff4d2e]" />
                  <span>Mostrando cupones de ejemplo. Los vendedores pueden crear sus propios cupones desde su panel para atraer más clientes.</span>
                </p>
              </div>
            )}
          </div>
        )}

        <Link href="/coupons/promociones" className="block w-full mt-6 bg-[#3483FA] text-white py-3 rounded-lg font-medium text-center hover:bg-[#2968C8] transition-colors">
          Ver promociones del mes
        </Link>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/quienes-somos" className="hover:text-[#3483FA]">Trabajá con nosotros</Link>
            <Link href="/legal/terminos" className="hover:text-[#3483FA]">Términos y condiciones</Link>
            <Link href="/offers" className="hover:text-[#3483FA]">Promociones</Link>
            <Link href="/ayuda" className="hover:text-[#3483FA]">Ayuda</Link>
          </div>
          <div className="text-center mt-4 text-xs text-muted-foreground">
            Copyright © 2026 MadsJeez Commerce Group S.R.L.
          </div>
        </div>
      </footer>
    </div>
  )
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const formatCurrency = (amount: number) => "$" + amount.toLocaleString("es-AR")

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return "¡Vence hoy!"
    if (diffDays === 1) return "Vence mañana"
    if (diffDays <= 7) return `Vence en ${diffDays} días`
    return `Vence el ${date.toLocaleDateString("es-AR")}`
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coupon.store.logo} alt={coupon.store.name} className="w-12 h-12 rounded-lg object-cover bg-muted" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm truncate">
            {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : formatCurrency(coupon.discountValue) + " OFF"}{" "}
            {coupon.store.name}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">{coupon.description}</p>
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground mb-3">
        <p>Compra mínima {formatCurrency(coupon.minPurchase)}</p>
        <p>Tope de {formatCurrency(coupon.maxDiscount)}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className={cn(coupon.isUrgent && "text-[#ff4d2e] font-medium", coupon.isEnding && !coupon.isUrgent && "text-[#f97316]")}>
            {formatDate(coupon.expiresAt)}
          </span>
        </div>
        <button className="bg-[#3483FA] text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-[#2968C8] transition-colors">
          Aplicar
        </button>
      </div>

      {coupon.isEnding && <p className="text-xs text-[#f97316] mt-2">¡Por agotarse!</p>}
    </div>
  )
}
