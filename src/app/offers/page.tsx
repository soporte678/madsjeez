"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import Navbar from "@/components/Navbar"
import {
  Search,
  Filter,
  Zap,
  Package,
  Tag,
  Truck,
  Star,
  Percent,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FlashCountdown } from "@/components/offers/FlashCountdown"

interface Offer {
  id: string
  title: string
  price: number
  original_price: number
  discount_percentage: number
  badge: string
  badge_color: string
  image: string
  seller: {
    id: string
    full_name: string
    reputation: string
  }
  category: {
    name: string
    slug: string
  }
  shipping: string
  rating: number
  reviews_count: number
  installments: string
  promotion_source?: "seller_campaign" | "seller_discount" | "seasonal"
  promotion_name?: string | null
  campaign_id?: string | null
  campaign_type?: string | null
  seasonal_event?: string | null
  ends_at?: string | null
  starts_at?: string | null
  is_flash_sale?: boolean
}

type SeasonalChip = {
  slug: string
  name: string
  badge: string
  badgeColor: string
}

interface CategoryFilter {
  name: string
  slug: string
  count: number
}

const baseQuickCategories = [
  { name: "Todas las ofertas", icon: Package, slug: "all" },
  { name: "Ofertas relámpago", icon: Zap, slug: "flash" },
  { name: "Mejor descuento", icon: Tag, slug: "best" },
  { name: "Liquidación", icon: Percent, slug: "clearance" },
]

const badgeClassByColor: Record<string, string> = {
  hot: "bg-gradient-to-r from-[#f97316] to-[#ff9100] shadow-[0_4px_14px_rgba(249,115,22,0.35)]",
  day: "bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9] shadow-[0_4px_14px_rgba(56,189,248,0.3)]",
  flash: "bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-[0_4px_14px_rgba(168,85,247,0.35)]",
  top: "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_4px_14px_rgba(16,185,129,0.3)]",
  blue: "bg-gradient-to-r from-[#f97316] to-[#ff9100]",
  orange: "bg-gradient-to-r from-[#38bdf8] to-[#0ea5e9]",
  green: "bg-gradient-to-r from-emerald-500 to-teal-500",
  purple: "bg-gradient-to-r from-violet-500 to-fuchsia-500",
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [categories, setCategories] = useState<CategoryFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [flashCategoryFilter, setFlashCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [sortBy, setSortBy] = useState("discount_desc")
  const [filters, setFilters] = useState({
    freeShipping: false,
    minDiscount: 10,
    minPrice: "",
    maxPrice: "",
    flash: false
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [seasonalEvents, setSeasonalEvents] = useState<SeasonalChip[]>([])

  // Función para cargar ofertas
  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Si hay búsqueda, usar esa
      if (searchQuery) {
        params.set("search", searchQuery)
      }
      
      if (activeCategory === "flash") {
        params.set("category", "flash")
        if (flashCategoryFilter) params.set("subcategory", flashCategoryFilter)
      } else if (activeCategory && activeCategory !== "all") {
        params.set("category", activeCategory)
      }
      
      // Filtros
      if (filters.freeShipping) params.set("freeShipping", "true")
      if (filters.flash) params.set("flash", "true")
      if (filters.minPrice) params.set("minPrice", filters.minPrice)
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice)
      params.set("minDiscount", filters.minDiscount.toString())
      params.set("sort", sortBy)
      params.set("page", page.toString())

      const response = await fetch(`/api/offers?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
        setCategories(data.categories || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setStats(data.stats)
        setSeasonalEvents(data.seasonalEvents || [])
      }
    } catch (error) {
      console.error("Error loading offers:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeCategory, flashCategoryFilter, filters, sortBy, page])

  // Cargar ofertas al inicio y cuando cambian los filtros
  useEffect(() => {
    loadOffers()
  }, [loadOffers])

  // Función para manejar búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOffers()
  }

  // Calcular descuento promedio
  const avgDiscount = offers.length > 0
    ? Math.round(offers.reduce((sum, o) => sum + o.discount_percentage, 0) / offers.length)
    : 0

  const quickCategories = [
    ...baseQuickCategories,
    ...seasonalEvents.map((e) => ({ name: e.name, icon: Sparkles, slug: e.slug })),
  ]

  const isFlashTab = activeCategory === "flash"

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b1220_0%,#0f172a_42%,#111827_100%)] text-slate-100">
      <Navbar />

      <section
        className={cn(
          "border-b border-white/10",
          isFlashTab
            ? "bg-[linear-gradient(90deg,rgba(139,92,246,0.22)_0%,rgba(249,115,22,0.12)_50%,transparent_100%)]"
            : "bg-[linear-gradient(90deg,rgba(249,115,22,0.14)_0%,rgba(56,189,248,0.1)_48%,transparent_100%)]"
        )}
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p
              className={cn(
                "text-[11px] font-black uppercase tracking-[0.2em]",
                isFlashTab ? "text-violet-300" : "text-sky-300"
              )}
            >
              {isFlashTab ? "Madsjeez Flash" : "Madsjeez Deals"}
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl">
              {isFlashTab ? "Ofertas relámpago" : "Ofertas del marketplace"}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              {isFlashTab
                ? "Promociones cortas creadas por vendedores: productos especiales con descuento por horario limitado (hasta 48 h)."
                : "Promociones que cargan los vendedores y descuentos de fechas especiales (Black Friday, Cyber Monday, Hot Sale y más)."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-orange-400/40 hover:bg-white/10"
          >
            <Search className="h-4 w-4 text-orange-400" />
            Buscar en ofertas
          </button>
        </div>
      </section>

      {/* Búsqueda segmentada para Ofertas */}
      {showSearchBar && (
        <div className="border-b border-white/10 bg-[#0f172a]/90 backdrop-blur-md py-3">
          <div className="max-w-[1200px] mx-auto px-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar en OFERTAS..."
                  className="w-full px-4 py-2 pl-10 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white px-4 py-2 rounded-lg font-medium hover:from-[#ff9100] hover:to-[#ffb703] transition-all"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={() => { setShowSearchBar(false); setSearchQuery(""); setPage(1); loadOffers(); }}
                className="px-4 py-2 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f97316]" />
              Buscando solo en la sección de Ofertas ({offers.length} productos con descuento)
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="mb-6 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_rgba(2,6,23,0.2)] backdrop-blur-md">
          <div className="flex overflow-x-auto scrollbar-hide">
            {quickCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  const next = cat.slug === activeCategory ? "all" : cat.slug
                  setActiveCategory(next)
                  if (next === "flash") {
                    setFilters((f) => ({ ...f, minDiscount: 1, flash: false }))
                    setSortBy("ending_soon")
                    setFlashCategoryFilter(null)
                  } else {
                    setFlashCategoryFilter(null)
                  }
                  setPage(1)
                }}
                className={cn(
                  "flex flex-col items-center gap-2 px-6 py-4 min-w-[120px] transition-colors border-b-2 whitespace-nowrap",
                  activeCategory === cat.slug
                    ? cat.slug === "flash"
                      ? "border-violet-400 bg-violet-500/10 text-violet-300"
                      : "border-orange-400 bg-orange-500/10 text-orange-300"
                    : "border-transparent text-slate-300 hover:bg-white/5"
                )}
              >
                {cat.icon && <cat.icon className="w-6 h-6" />}
                <span className="text-sm font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Layout: Sidebar + Content */}
        <div className="flex gap-4">
          {/* Sidebar - Filtros */}
          <aside className="w-64 flex-shrink-0">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
                <Filter className="w-4 h-4 text-slate-300" />
                <span className="font-semibold text-white">Filtros</span>
              </div>

              {isFlashTab && (
                <div className="mb-4 rounded-lg border border-violet-400/30 bg-violet-500/10 p-3 text-xs leading-relaxed text-violet-200">
                  Promos creadas por vendedores, vigentes entre 1 y 48 horas. Ordenadas por las que terminan antes.
                </div>
              )}

              {/* Resultados */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="text-sm text-slate-300">
                  <span className="font-bold text-white">{offers.length}</span> resultados
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Descuento promedio:{" "}
                  <span className={cn("font-bold", isFlashTab ? "text-violet-300" : "text-[#f97316]")}>
                    {avgDiscount}%
                  </span>
                </p>
              </div>

              <div className="mb-4 border-b border-white/10 pb-4">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 shrink-0 text-sky-300" />
                    <div>
                      <span className="text-sm font-semibold text-white">Envío Madsjeez</span>
                      <span className="ml-2 text-xs text-slate-400">sin costo extra</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.freeShipping}
                    onChange={(e) => { setFilters(f => ({ ...f, freeShipping: e.target.checked })); setPage(1); }}
                    className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-[#f97316] relative after:w-4 after:h-4 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-5 after:transition-all cursor-pointer"
                  />
                </label>
              </div>

              {!isFlashTab && (
              <>
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Tiempo de entrega</p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                    <input type="radio" name="delivery" className="accent-[#f97316]" />
                    <span>Entrega express</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                    <input type="radio" name="delivery" className="accent-[#f97316]" />
                    <span>En menos de 24 h</span>
                  </label>
                </div>
              </div>

              {/* Tipo de promoción */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Tipo de promoción</p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                    <input type="checkbox" className="accent-[#f97316]" />
                    <span>Flash Madsjeez</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                    <input 
                      type="checkbox" 
                      className="accent-[#f97316]"
                      checked={filters.flash}
                      onChange={(e) => { setFilters(f => ({ ...f, flash: e.target.checked })); setPage(1); }}
                    />
                    <span>Destacado del día</span>
                  </label>
                </div>
              </div>
              </>
              )}

              {/* Categorías */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Categorías</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label 
                      key={cat.slug}
                      className={cn(
                        "flex items-center justify-between text-sm cursor-pointer hover:text-[#f97316]",
                        (isFlashTab ? flashCategoryFilter === cat.slug : activeCategory === cat.slug)
                          ? "text-[#f97316] font-medium"
                          : "text-slate-300"
                      )}
                      onClick={() => {
                        if (isFlashTab) {
                          setFlashCategoryFilter((prev) => (prev === cat.slug ? null : cat.slug))
                        } else {
                          setActiveCategory(cat.slug)
                        }
                        setPage(1)
                      }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-slate-400">({cat.count})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Precio</p>
                <div className="space-y-2">
                  {["Hasta $40.000", "$40.000 a $100.000", "Más de $100.000"].map((range) => (
                    <label key={range} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                      <input type="checkbox" className="accent-[#f97316]" />
                      <span>{range}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    className="w-1/2 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#f97316]"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Máximo"
                    className="w-1/2 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#f97316]"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  />
                </div>
              </div>

              {/* Cuotas */}
              <div className="mb-4 pb-4 border-b border-white/10">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Cuotas</p>
                <div className="space-y-1">
                  {["En cuotas", "Sin interés", "Cuota promocionada", "Mejor precio en cuotas"].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                      <input type="checkbox" className="accent-[#f97316]" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Costo de envío */}
              <div className="mb-4">
                <p className="font-semibold text-slate-200 mb-2 text-sm">Costo de envío</p>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-[#f97316]">
                  <input 
                    type="checkbox" 
                    className="accent-[#f97316]"
                    checked={filters.freeShipping}
                    onChange={(e) => { setFilters(f => ({ ...f, freeShipping: e.target.checked })); setPage(1); }}
                  />
                  <span>Gratis ({offers.filter(o => o.shipping === "free").length})</span>
                </label>
              </div>

              {/* Limpiar filtros */}
              <button
                onClick={() => {
                  setFilters({ freeShipping: false, minDiscount: 10, minPrice: "", maxPrice: "", flash: false })
                  setActiveCategory("all")
                  setSearchQuery("")
                  setPage(1)
                }}
                className="w-full py-2 text-sm text-[#f97316] hover:bg-[#f97316]/5 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </aside>

          {/* Content - Product Grid */}
          <div className="flex-1">
            {/* Barra de ordenamiento */}
            <div className="mb-4 flex items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <p className="text-sm text-slate-300">
                <span className="font-bold text-white">{offers.length}</span> resultados
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  disabled={isFlashTab}
                  className="text-sm border border-white/15 bg-slate-900/50 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none focus:border-[#f97316] disabled:opacity-60"
                >
                  {isFlashTab ? (
                    <option value="ending_soon">Termina antes</option>
                  ) : (
                    <>
                      <option value="discount_desc">Mayor descuento</option>
                      <option value="price_asc">Menor precio</option>
                      <option value="price_desc">Mayor precio</option>
                      <option value="newest">Más reciente</option>
                      <option value="popular">Más popular</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Grid de productos */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="aspect-square bg-slate-200 rounded-lg mb-3" />
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : offers.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {offers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} />
                  ))}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-[#f97316] hover:text-[#f97316]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {[...Array(totalPages)].slice(0, 10).map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setPage(i + 1)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium",
                          page === i + 1
                            ? "bg-[#f97316] text-white"
                            : "text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-[#f97316] hover:text-[#f97316]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-12 text-center backdrop-blur-md">
                <p className="text-lg text-slate-300">
                  {isFlashTab
                    ? "No hay ofertas relámpago activas en este momento"
                    : "No encontramos ofertas con esos filtros"}
                </p>
                {isFlashTab && (
                  <p className="mt-2 text-sm text-slate-400">
                    Los vendedores crean ofertas relámpago de 1 a 48 horas desde su panel.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {isFlashTab && (
                    <Link
                      href="/dashboard"
                      className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-semibold text-white"
                    >
                      Soy vendedor — crear relámpago
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ freeShipping: false, minDiscount: 10, minPrice: "", maxPrice: "", flash: false })
                      setActiveCategory("all")
                      setSearchQuery("")
                    }}
                    className="rounded-lg border border-white/15 bg-white/5 px-6 py-2 text-white hover:bg-white/10"
                  >
                    Ver todas las ofertas
                  </button>
                </div>
              </div>
            )}

            {stats && !loading && offers.length > 0 && (
              <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
                <p className="flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles className="h-4 w-4 text-orange-400" />
                  <span>
                    <strong className="text-white">{String(stats.total_offers)}</strong> ofertas reales ·{" "}
                    <strong className="text-white">{String(stats.seller_campaigns)}</strong> por campaña de vendedores ·{" "}
                    <strong className="text-white">{String(stats.seller_discounts)}</strong> con precio promocional
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 bg-[#0b1220]">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link href="/about" className="hover:text-[#f97316] hover:underline">Trabajá con nosotros</Link>
            <Link href="/legal/terminos" className="hover:text-[#f97316] hover:underline">Términos y condiciones</Link>
            <Link href="/promotions" className="hover:text-[#f97316] hover:underline">Promociones</Link>
            <Link href="/legal/privacidad" className="hover:text-[#f97316] hover:underline">Cómo cuidamos tu privacidad</Link>
            <Link href="/ayuda" className="hover:text-[#f97316] hover:underline">Ayuda</Link>
          </div>
          <div className="text-center mt-4 text-xs text-slate-400">
            Copyright © 2026 MadsJeez Commerce Group S.R.L. - Spegazzini, Buenos Aires, Argentina
          </div>
        </div>
      </footer>
    </div>
  )
}

function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link href={`/product/${offer.id}`}>
      <article className="group overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] shadow-[0_14px_34px_rgba(2,6,23,0.18)] transition hover:-translate-y-1 hover:border-orange-400/30 hover:shadow-[0_18px_40px_rgba(249,115,22,0.12)]">
        {/* Badge de oferta */}
        <div className="relative">
          {offer.badge && (
            <span
              className={cn(
                "absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white",
                badgeClassByColor[offer.badge_color] || badgeClassByColor.day
              )}
            >
              {offer.badge}
            </span>
          )}
          
          {/* Imagen */}
          <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-800/40 p-4">
            <img
              src={offer.image}
              alt={offer.title}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Info */}
        <div className="border-t border-white/10 p-4">
          <h3 className="mb-2 line-clamp-2 min-h-[40px] text-sm font-medium text-slate-100">
            {offer.title}
          </h3>

          {/* Precio original tachado */}
          <p className="text-sm text-slate-400 line-through">
            ${offer.original_price.toLocaleString("es-AR")}
          </p>

          {/* Precio actual y descuento */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-white">
              ${offer.price.toLocaleString("es-AR")}
            </span>
            <span className="text-sm font-bold text-orange-300">
              {offer.discount_percentage}% OFF
            </span>
          </div>

          {offer.is_flash_sale && offer.ends_at && <FlashCountdown endsAt={offer.ends_at} />}

          <p className="mb-2 text-sm text-sky-300/90">{offer.installments}</p>

          {offer.shipping === "free" && (
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-emerald-400">
              <Truck className="h-3.5 w-3.5" />
              Envío gratis Madsjeez
            </p>
          )}

          {/* Rating y reviews */}
          {offer.rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < Math.floor(offer.rating) ? "fill-orange-400 text-orange-400" : "text-slate-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">({offer.reviews_count})</span>
            </div>
          )}

          {/* Vendedor */}
          <p className="text-xs text-slate-500">
            Por <span className="font-medium text-sky-300">{offer.seller.full_name}</span>
            {offer.seller.reputation === "platinum" && (
              <span className="ml-1 rounded bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-200">
                Elite
              </span>
            )}
          </p>

          {/* Demo badge */}
          {offer.promotion_name && (
            <p className="mt-2 text-[11px] font-medium text-sky-300/90">
              {offer.promotion_name}
              {offer.ends_at && (
                <span className="text-slate-500">
                  {" "}
                  · hasta {new Date(offer.ends_at).toLocaleDateString("es-AR")}
                </span>
              )}
            </p>
          )}
        </div>
      </article>
    </Link>
  )
}


