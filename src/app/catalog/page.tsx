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

// Datos de demostración
const demoProducts = [
  {
    id: "1",
    title: "Auriculares Inalámbricos Premium con Cancelación de Ruido",
    price: 125000,
    original_price: 150000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    rating: 4.8,
    sold_quantity: 234,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "TechStore", reputation: "Platinum" }
  },
  {
    id: "2",
    title: "Smart TV 55\" 4K UHD Crystal Ultra HD",
    price: 450000,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80",
    rating: 4.9,
    sold_quantity: 89,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "ElectroHogar", reputation: "Gold" }
  },
  {
    id: "3",
    title: "Zapatillas Running Pro Aerodinámicas",
    price: 85000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    rating: 4.5,
    sold_quantity: 567,
    free_shipping: false,
    condition: "Nuevo",
    seller: { name: "SportWorld", reputation: "Silver" }
  },
  {
    id: "4",
    title: "Silla Gamer Ergonómica Reclinable RGB",
    price: 190000,
    original_price: 220000,
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=80",
    rating: 4.7,
    sold_quantity: 123,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "GamerPro", reputation: "Gold" }
  },
  {
    id: "5",
    title: "Smartphone 128GB 5G Cámara Dual 48MP",
    price: 320000,
    original_price: 350000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80",
    rating: 4.6,
    sold_quantity: 892,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "MobileStore", reputation: "Platinum" }
  },
  {
    id: "6",
    title: "Notebook Ultrabook 14\" SSD 512GB",
    price: 680000,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80",
    rating: 4.8,
    sold_quantity: 45,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "Compumundo", reputation: "Gold" }
  },
  {
    id: "7",
    title: "Cafetera Express Automática",
    price: 145000,
    original_price: 180000,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=500&q=80",
    rating: 4.4,
    sold_quantity: 234,
    free_shipping: false,
    condition: "Nuevo",
    seller: { name: "CasaIdeal", reputation: "Silver" }
  },
  {
    id: "8",
    title: "Aspiradora Robot Inteligente con Mapeo",
    price: 95000,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80",
    rating: 4.3,
    sold_quantity: 445,
    free_shipping: true,
    condition: "Nuevo",
    seller: { name: "CleanTech", reputation: "Gold" }
  }
]

const categories = [
  { name: "Tecnología", icon: "💻", count: 1250 },
  { name: "Hogar", icon: "🏠", count: 890 },
  { name: "Deportes", icon: "⚽", count: 567 },
  { name: "Moda", icon: "👕", count: 2340 },
  { name: "Electro", icon: "📺", count: 445 },
  { name: "Juguetes", icon: "🎮", count: 678 },
]

export default function CatalogPage() {
  const [products, setProducts] = useState(demoProducts)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("relevance")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

          {/* Products Grid */}
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
            {sortedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full border border-slate-100 hover:border-blue-200"
              >
                <div className="relative w-full aspect-square bg-slate-50 p-4 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    className="object-contain group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-300 hover:text-rose-500 shadow-sm transition-colors">
                    <Heart size={18} />
                  </button>
                  
                  {product.original_price && (
                    <div className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-full">
                      -{Math.round((1 - product.price / product.original_price) * 100)}%
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-grow">
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl font-black text-slate-900">
                        ${product.price.toLocaleString("es-AR")}
003c/span>
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

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-2">
            <Button variant="outline" disabled className="gap-1">
              <ChevronLeft size={16} />
              Anterior
            </Button>
            <Button className="bg-blue-600">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <span className="px-2 py-2 text-slate-400">...</span>
            <Button variant="outline" className="gap-1">
              Siguiente
              <ChevronRight size={16} />
            </Button>
          </div>
        </main>
      </div>
    </div>
  )
}
