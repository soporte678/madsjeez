"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutList,
  Star,
  Truck,
  Heart,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal
} from "lucide-react"

interface ApiProduct {
  id: string
  title: string
  price: number
  compare_price?: number | null
  originalPrice?: number | null
  product_images?: { url: string; order?: number; is_primary?: boolean }[]
  images?: { url: string; order?: number }[]
  image?: string | null
  sales?: number
  sold_quantity?: number
  free_shipping?: boolean
  freeShipping?: boolean
  condition?: string
  rating?: number
  seller?: {
    name?: string | null
    seller_name?: string | null
    sellerName?: string | null
    reputation_color?: string | null
    reputationColor?: string | null
  } | null
  category?: { name?: string | null } | null
}

const categories = [
  { name: "Tecnología", icon: "", count: 1250 },
  { name: "Hogar", icon: "", count: 890 },
  { name: "Deportes", icon: "", count: 567 },
  { name: "Moda", icon: "", count: 2340 },
  { name: "Electro", icon: "", count: 445 },
  { name: "Juguetes", icon: "", count: 678 },
]

function normalizeProduct(p: ApiProduct) {
  const images = p.product_images || p.images || []
  const primaryImage = images.find((img) => (img as any).is_primary)?.url
  const firstImage = primaryImage || (images.length > 0 ? images[0].url : null) || p.image || null
  const sellerName = p.seller?.sellerName || p.seller?.seller_name || p.seller?.name || "Vendedor"
  const reputation = p.seller?.reputationColor || p.seller?.reputation_color || ""
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    original_price: p.compare_price || p.originalPrice || null,
    image: firstImage,
    rating: p.rating || 4.0,
    sold_quantity: p.sales || p.sold_quantity || 0,
    free_shipping: p.free_shipping || p.freeShipping || false,
    condition: p.condition || "Nuevo",
    seller: { name: sellerName, reputation },
  }
}

export default function CatalogPage() {
  const [products, setProducts] = useState<ReturnType<typeof normalizeProduct>[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("relevance")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", String(page))
        params.set("limit", "20")
        if (searchQuery) params.set("search", searchQuery)
        if (sortBy !== "relevance") params.set("sort", sortBy)

        const res = await fetch(`/api/products?${params.toString()}`)
        if (!res.ok) throw new Error("Error al cargar productos")
        const data = await res.json()
        const rawProducts: ApiProduct[] = data.products || []
        setProducts(rawProducts.map(normalizeProduct))
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (err) {
        console.error(err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [page, sortBy])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else {
        // re-fetch with new search query
        async function fetchProducts() {
          setLoading(true)
          try {
            const params = new URLSearchParams()
            params.set("page", "1")
            params.set("limit", "20")
            if (searchQuery) params.set("search", searchQuery)
            if (sortBy !== "relevance") params.set("sort", sortBy)

            const res = await fetch(`/api/products?${params.toString()}`)
            if (!res.ok) throw new Error("Error al cargar productos")
            const data = await res.json()
            const rawProducts: ApiProduct[] = data.products || []
            setProducts(rawProducts.map(normalizeProduct))
            setTotalPages(data.pagination?.totalPages || 1)
          } catch (err) {
            console.error(err)
            setProducts([])
          } finally {
            setLoading(false)
          }
        }
        fetchProducts()
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredProducts = products

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price_asc": return a.price - b.price
      case "price_desc": return b.price - a.price
      case "sold": return b.sold_quantity - a.sold_quantity
      case "rating": return b.rating - a.rating
      default: return 0
    }
  })

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <Header />
      
      {/* Breadcrumb & Search */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-blue-600">Inicio</Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Catálogo</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                type="text"
                placeholder="Buscar en todos los productos..."
                className="pl-12 py-3 rounded-xl border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter size={18} />
              Filtros
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-slate-900 mb-4">Categorías</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === "all" ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span>Todas las categorías</span>
                  <span className="text-sm text-slate-400">{products.length}</span>
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === cat.name ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span>{cat.icon} {cat.name}</span>
                    <span className="text-sm text-slate-400">{cat.count}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              Filtros
            </h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Condición</h4>
              <div className="space-y-2">
                {["Nuevo", "Usado", "Reacondicionado"].map((condition) => (
                  <label key={condition} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300" />
                    <span className="text-sm text-slate-600">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Precio</h4>
              <div className="flex gap-2">
                <Input placeholder="Min" className="text-sm" />
                <Input placeholder="Max" className="text-sm" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Envío</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300" />
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  <Truck size={14} className="text-green-600" />
                  Envío gratis
                </span>
              </label>
            </div>
          </div>

          {/* Promo Banner */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={24} />
              <span className="font-bold">Envío Gratis</span>
            </div>
            <p className="text-sm text-blue-100">
              En miles de productos seleccionados.
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Toolbar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">
              {sortedProducts.length} resultados
            </span>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600 hidden sm:inline">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="relevance">Más relevantes</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="sold">Más vendidos</option>
                  <option value="rating">Mejor calificados</option>
                </select>
              </div>

              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400"}`}
                >
                  <LayoutList size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Products Grid */}
          {!loading && (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {sortedProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No se encontraron productos
                </div>
              )}
              {sortedProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-slate-100 hover:border-blue-200"
                >
                  <div className="relative w-full aspect-square bg-slate-50 p-4 overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          const parent = (e.target as HTMLImageElement).parentElement
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fallback = document.createElement('div')
                            fallback.className = 'img-fallback w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm'
                            fallback.textContent = 'Sin imagen'
                            parent.appendChild(fallback)
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
                        Sin imagen
                      </div>
                    )}
                    <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-300 hover:text-rose-500 shadow-sm transition-colors z-10">
                      <Heart size={18} />
                    </button>
                    
                    {product.original_price && (
                      <div className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full z-10">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="mt-auto">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-black text-slate-900">
                          ${product.price.toLocaleString("es-AR")}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-slate-400 line-through">
                            ${product.original_price.toLocaleString("es-AR")}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-medium text-slate-700 leading-snug line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center text-yellow-400">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold text-slate-600 ml-1">{product.rating}</span>
                        </div>
                        <span className="text-xs text-slate-400">({product.sold_quantity} vendidos)</span>
                      </div>
                      
                      {product.free_shipping && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] font-black uppercase">
                          <Truck size={10} className="mr-1" />
                          Envío gratis
                        </Badge>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <Button 
                variant="outline" 
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="gap-1"
              >
                <ChevronLeft size={16} />
                Anterior
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show window around current page
                let pageNum = i + 1
                if (totalPages > 5 && page > 3) {
                  pageNum = page - 2 + i
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                }
                return (
                  <Button 
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    className={page === pageNum ? "bg-blue-600" : ""}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button 
                variant="outline" 
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="gap-1"
              >
                Siguiente
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
