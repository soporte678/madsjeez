"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import { 
  Search, Filter, Zap, Package, Tag, Truck, ChevronDown, 
  Star, Heart, ShoppingCart, TrendingUp, Percent, Clock,
  ChevronLeft, ChevronRight, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

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
  isDemo?: boolean
}

interface CategoryFilter {
  name: string
  slug: string
  count: number
}

// Categorías rápidas al estilo MercadoLibre
const quickCategories = [
  { name: "Todas las ofertas", icon: Package, slug: "all" },
  { name: "Ofertas relámpago", icon: Zap, slug: "flash" },
  { name: "Precios imbatibles", icon: Tag, slug: "best" },
  { name: "Celulares", icon: null, slug: "celulares" },
  { name: "Notebooks", icon: null, slug: "computacion" },
  { name: "Liquidación", icon: Percent, slug: "clearance" },
]

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([])
  const [categories, setCategories] = useState<CategoryFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
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
  const [stats, setStats] = useState<any>(null)

  // Función para cargar ofertas
  const loadOffers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Si hay búsqueda, usar esa
      if (searchQuery) {
        params.set("search", searchQuery)
      }
      
      // Si hay categoría seleccionada (y no es "all")
      if (activeCategory && activeCategory !== "all") {
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
      params.set("demo", "true") // Siempre incluir demo para la vista

      const response = await fetch(`/api/offers?${params.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setOffers(data.offers || [])
        setCategories(data.categories || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading offers:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, activeCategory, filters, sortBy, page])

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

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      {/* Header con gradiente amarillo */}
      <header className="bg-gradient-to-r from-[#FFC107] via-[#FFD700] to-[#FFC107] border-b border-[#FF6B4A]/20">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-lg flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 100 100" className="w-6 h-6">
                  <path d="M 15 80 L 35 30 L 55 55" stroke="#FF6B4A" fill="none" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M 85 80 L 65 30 L 45 65" stroke="#00D4FF" fill="none" strokeWidth="15" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-black text-xl tracking-tighter text-[#2d3277]">MADSJEEZ</span>
            </Link>
            <span className="text-slate-600">|</span>
            <h1 className="text-lg font-medium text-slate-800">Ofertas</h1>
          </div>
        </div>
      </header>

      {/* Búsqueda segmentada para Ofertas */}
      {showSearchBar && (
        <div className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-[1200px] mx-auto px-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar en OFERTAS..."
                  className="w-full px-4 py-2 pl-10 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-[#FF6B4A] to-[#FF8C42] text-white px-4 py-2 rounded-lg font-medium hover:from-[#FF8C42] hover:to-[#FFC107] transition-all"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={() => { setShowSearchBar(false); setSearchQuery(""); setPage(1); loadOffers(); }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
            </form>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF6B4A]" />
              Buscando solo en la sección de Ofertas ({offers.length} productos con descuento)
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {/* Título y descripción */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Ofertas</h2>
              <p className="text-slate-600">¡Encontrá precios increíbles cada día!</p>
            </div>
            <button
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <Search className="w-4 h-4 text-[#FF6B4A]" />
              <span className="text-sm font-medium text-slate-700">Buscar en Ofertas</span>
            </button>
          </div>
        </div>

        {/* Categorías rápidas - Estilo MercadoLibre */}
        <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {quickCategories.map((cat, idx) => (
              <button
                key={cat.slug}
                onClick={() => { setActiveCategory(cat.slug === activeCategory ? "all" : cat.slug); setPage(1); }}
                className={cn(
                  "flex flex-col items-center gap-2 px-6 py-4 min-w-[120px] transition-colors border-b-2 whitespace-nowrap",
                  activeCategory === cat.slug 
                    ? "border-[#FF6B4A] text-[#FF6B4A] bg-[#FF6B4A]/5" 
                    : "border-transparent text-slate-600 hover:bg-slate-50"
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
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800">Filtros</span>
              </div>

              {/* Resultados */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="text-sm text-slate-600">
                  <span className="font-bold text-slate-800">{offers.length}</span> resultados
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Descuento promedio: <span className="text-[#FF6B4A] font-bold">{avgDiscount}%</span>
                </p>
              </div>

              {/* Toggle FULL te ahorra envíos */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-green-500 font-bold text-xs">⚡</span>
                      <span className="font-bold text-slate-700">FULL</span>
                    </div>
                    <span className="text-xs text-slate-600">te ahorra envíos</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={filters.freeShipping}
                    onChange={(e) => { setFilters(f => ({ ...f, freeShipping: e.target.checked })); setPage(1); }}
                    className="w-10 h-5 bg-slate-200 rounded-full appearance-none checked:bg-[#FF6B4A] relative after:w-4 after:h-4 after:bg-white after:rounded-full after:absolute after:top-0.5 after:left-0.5 checked:after:translate-x-5 after:transition-all cursor-pointer"
                  />
                </label>
                <p className="text-xs text-slate-400 mt-1">Con el carrito de compras</p>
              </div>

              {/* Tiempo de entrega */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Tiempo de entrega</p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                    <input type="radio" name="delivery" className="accent-[#FF6B4A]" />
                    <span>Llega hoy (6279)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                    <input type="radio" name="delivery" className="accent-[#FF6B4A]" />
                    <span>Llega en menos de 24 h (8280)</span>
                  </label>
                </div>
              </div>

              {/* Tipo de promoción */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Tipo de promoción</p>
                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                    <input type="checkbox" className="accent-[#FF6B4A]" />
                    <span>Oferta relámpago (1339)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                    <input 
                      type="checkbox" 
                      className="accent-[#FF6B4A]"
                      checked={filters.flash}
                      onChange={(e) => { setFilters(f => ({ ...f, flash: e.target.checked })); setPage(1); }}
                    />
                    <span>Oferta del día (117)</span>
                  </label>
                </div>
              </div>

              {/* Categorías */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Categorías</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categories.map((cat) => (
                    <label 
                      key={cat.slug}
                      className={cn(
                        "flex items-center justify-between text-sm cursor-pointer hover:text-[#FF6B4A]",
                        activeCategory === cat.slug ? "text-[#FF6B4A] font-medium" : "text-slate-600"
                      )}
                      onClick={() => { setActiveCategory(cat.slug); setPage(1); }}
                    >
                      <span>{cat.name}</span>
                      <span className="text-slate-400">({cat.count})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Precio */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Precio</p>
                <div className="space-y-2">
                  {["Hasta $40.000", "$40.000 a $100.000", "Más de $100.000"].map((range) => (
                    <label key={range} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                      <input type="checkbox" className="accent-[#FF6B4A]" />
                      <span>{range}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <input
                    type="number"
                    placeholder="Mínimo"
                    className="w-1/2 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#FF6B4A]"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Máximo"
                    className="w-1/2 px-2 py-1 text-sm border border-slate-200 rounded focus:outline-none focus:border-[#FF6B4A]"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                  />
                </div>
              </div>

              {/* Cuotas */}
              <div className="mb-4 pb-4 border-b border-slate-100">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Cuotas</p>
                <div className="space-y-1">
                  {["En cuotas", "Sin interés", "Cuota promocionada", "Mejor precio en cuotas"].map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                      <input type="checkbox" className="accent-[#FF6B4A]" />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Costo de envío */}
              <div className="mb-4">
                <p className="font-semibold text-slate-700 mb-2 text-sm">Costo de envío</p>
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-[#FF6B4A]">
                  <input 
                    type="checkbox" 
                    className="accent-[#FF6B4A]"
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
                className="w-full py-2 text-sm text-[#FF6B4A] hover:bg-[#FF6B4A]/5 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </aside>

          {/* Content - Product Grid */}
          <div className="flex-1">
            {/* Barra de ordenamiento */}
            <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-800">{offers.length}</span> resultados
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#FF6B4A]"
                >
                  <option value="discount_desc">Mayor descuento</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="newest">Más reciente</option>
                  <option value="popular">Más popular</option>
                </select>
              </div>
            </div>

            {/* Grid de productos */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
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
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
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
                            ? "bg-[#FF6B4A] text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-slate-500 text-lg">No encontramos ofertas con esos filtros</p>
                <button
                  onClick={() => {
                    setFilters({ freeShipping: false, minDiscount: 10, minPrice: "", maxPrice: "", flash: false })
                    setActiveCategory("all")
                    setSearchQuery("")
                  }}
                  className="mt-4 px-6 py-2 bg-[#FF6B4A] text-white rounded-lg hover:bg-[#FF8C42] transition-colors"
                >
                  Ver todas las ofertas
                </button>
              </div>
            )}

            {/* Indicador de productos demo */}
            {stats?.demo_offers_used > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-[#FFC107]/20 to-[#FF6B4A]/10 rounded-lg border border-[#FFC107]/30">
                <p className="text-sm text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#FF6B4A]" />
                  <span>
                    Mostrando <span className="font-bold text-[#FF6B4A]">{stats.demo_offers_used}</span> ofertas de ejemplo. 
                    ¡Publicá tus productos con descuentos para que aparezcan aquí!
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link href="/about" className="hover:text-[#FF6B4A] hover:underline">Trabajá con nosotros</Link>
            <Link href="/legal/terminos" className="hover:text-[#FF6B4A] hover:underline">Términos y condiciones</Link>
            <Link href="/promotions" className="hover:text-[#FF6B4A] hover:underline">Promociones</Link>
            <Link href="/legal/privacidad" className="hover:text-[#FF6B4A] hover:underline">Cómo cuidamos tu privacidad</Link>
            <Link href="/help" className="hover:text-[#FF6B4A] hover:underline">Ayuda</Link>
          </div>
          <div className="text-center mt-4 text-xs text-slate-400">
            Copyright © 2026 MadsJeez Commerce Group S.R.L. - Spegazzini, Buenos Aires, Argentina
          </div>
        </div>
      </footer>
    </div>
  )
}

// Componente de tarjeta de oferta al estilo MercadoLibre
function OfferCard({ offer }: { offer: Offer }) {
  const savings = offer.original_price - offer.price

  return (
    <Link href={`/product/${offer.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
        {/* Badge de oferta */}
        <div className="relative">
          {offer.badge && (
            <div className={cn(
              "absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-bold rounded text-white",
              offer.badge_color === "blue" && "bg-blue-500",
              offer.badge_color === "orange" && "bg-orange-500",
              offer.badge_color === "green" && "bg-green-500",
              offer.badge_color === "purple" && "bg-purple-500",
            )}>
              {offer.badge}
            </div>
          )}
          
          {/* Imagen */}
          <div className="aspect-square bg-white p-4 flex items-center justify-center">
            <img
              src={offer.image}
              alt={offer.title}
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-t border-slate-100">
          {/* Título */}
          <h3 className="text-sm text-slate-800 line-clamp-2 mb-2 min-h-[40px]">
            {offer.title}
          </h3>

          {/* Precio original tachado */}
          <p className="text-sm text-slate-400 line-through">
            ${offer.original_price.toLocaleString("es-AR")}
          </p>

          {/* Precio actual y descuento */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xl font-bold text-slate-900">
              ${offer.price.toLocaleString("es-AR")}
            </span>
            <span className="text-sm font-semibold text-green-600">
              {offer.discount_percentage}% OFF
            </span>
          </div>

          {/* Cuotas */}
          <p className="text-sm text-green-600 mb-2">
            {offer.installments}
          </p>

          {/* Envío */}
          {offer.shipping === "free" && (
            <p className="text-sm font-bold text-green-600 flex items-center gap-1 mb-2">
              <span className="text-xs">⚡</span>
              <span>Llega gratis hoy</span>
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
                      i < Math.floor(offer.rating) ? "text-[#3483FA] fill-[#3483FA]" : "text-slate-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">({offer.reviews_count})</span>
            </div>
          )}

          {/* Vendedor */}
          <p className="text-xs text-slate-500">
            Por <span className="text-[#3483FA]">{offer.seller.full_name}</span>
            {offer.seller.reputation === "platinum" && (
              <span className="ml-1 text-[#3483FA]">Platinum</span>
            )}
          </p>

          {/* Demo badge */}
          {offer.isDemo && (
            <p className="text-[10px] text-orange-500 mt-2 italic">
              * Oferta de ejemplo
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
