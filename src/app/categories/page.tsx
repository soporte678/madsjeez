"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { 
  Car, Sprout, Apple, PawPrint, Gem, Palette, Briefcase, 
  Baby, Sparkles, Camera, Smartphone, Laptop, Gamepad2, 
  HardHat, Dumbbell, Wind, Tv, Ticket, Wrench, Home, 
  Factory, Building2, Music, Watch, ToyBrick, BookOpen, 
  Film, Shirt, HeartPulse, Truck, PartyPopper, MoreHorizontal,
  ArrowRight
} from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  children: {
    id: string
    name: string
    slug: string
  }[]
}

// Iconos por categoría
const categoryIcons: Record<string, React.ReactNode> = {
  "accesorios-para-vehiculos": <Car className="w-5 h-5" />,
  "agro": <Sprout className="w-5 h-5" />,
  "alimentos-y-bebidas": <Apple className="w-5 h-5" />,
  "animales-y-mascotas": <PawPrint className="w-5 h-5" />,
  "antiguedades-y-colecciones": <Gem className="w-5 h-5" />,
  "arte-libreria-y-merceria": <Palette className="w-5 h-5" />,
  "autos-motos-y-otros": <Car className="w-5 h-5" />,
  "bebes": <Baby className="w-5 h-5" />,
  "belleza-y-cuidado-personal": <Sparkles className="w-5 h-5" />,
  "camaras-y-accesorios": <Camera className="w-5 h-5" />,
  "celulares-y-telefonia": <Smartphone className="w-5 h-5" />,
  "computacion": <Laptop className="w-5 h-5" />,
  "consolas-y-videojuegos": <Gamepad2 className="w-5 h-5" />,
  "construccion": <HardHat className="w-5 h-5" />,
  "deportes-y-fitness": <Dumbbell className="w-5 h-5" />,
  "electrodomesticos-y-aires": <Wind className="w-5 h-5" />,
  "electronica-audio-y-video": <Tv className="w-5 h-5" />,
  "entradas-para-eventos": <Ticket className="w-5 h-5" />,
  "herramientas": <Wrench className="w-5 h-5" />,
  "hogar-muebles-y-jardin": <Home className="w-5 h-5" />,
  "industrias-y-oficinas": <Factory className="w-5 h-5" />,
  "inmuebles": <Building2 className="w-5 h-5" />,
  "instrumentos-musicales": <Music className="w-5 h-5" />,
  "joyas-y-relojes": <Watch className="w-5 h-5" />,
  "juegos-y-juguetes": <ToyBrick className="w-5 h-5" />,
  "libros-revistas-y-comics": <BookOpen className="w-5 h-5" />,
  "musica-peliculas-y-series": <Film className="w-5 h-5" />,
  "ropa-y-accesorios": <Shirt className="w-5 h-5" />,
  "salud-y-equipamiento-medico": <HeartPulse className="w-5 h-5" />,
  "servicios": <Truck className="w-5 h-5" />,
  "souvenirs-cotillon-y-fiestas": <PartyPopper className="w-5 h-5" />,
  "otros": <MoreHorizontal className="w-5 h-5" />,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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
            <h1 className="text-lg font-medium text-slate-800">Categorías</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-8">
          Categorías para comprar y vender
        </h2>

        {loading ? (
          <div className="space-y-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-64 mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {categories.map((category) => (
              <section key={category.id} className="border-b border-slate-100 pb-10 last:border-0">
                {/* Categoría Principal */}
                <Link 
                  href={`/category/${category.slug}`}
                  className="group flex items-center gap-2 mb-4 hover:text-[#FF6B4A] transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B4A]/10 to-[#FFC107]/10 flex items-center justify-center text-[#FF6B4A] group-hover:from-[#FF6B4A] group-hover:to-[#FF8C42] group-hover:text-white transition-all">
                    {categoryIcons[category.slug] || <ArrowRight className="w-5 h-5" />}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#FF6B4A]">
                    {category.name}
                  </h3>
                  <span className="text-sm text-slate-400 ml-2">
                    ({category.productCount} productos)
                  </span>
                </Link>

                {/* Subcategorías en 4 columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                  {category.children?.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      className="text-sm text-slate-500 hover:text-[#FF6B4A] hover:underline py-1 transition-colors"
                    >
                      {child.name}
                    </Link>
                  )) || (
                    <span className="text-sm text-slate-400 italic">
                      No hay subcategorías
                    </span>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-500 text-lg">No hay categorías disponibles</p>
            <p className="text-slate-400 text-sm mt-2">
              Intenta recargar la página o contacta soporte
            </p>
          </div>
        )}
      </main>

      {/* Footer Info - Estilo MercadoLibre */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-[1200px] mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <Link href="/about" className="hover:text-[#FF6B4A] hover:underline">Trabajá con nosotros</Link>
            <Link href="/legal/terminos" className="hover:text-[#FF6B4A] hover:underline">Términos y condiciones</Link>
            <Link href="/promotions" className="hover:text-[#FF6B4A] hover:underline">Promociones</Link>
            <Link href="/legal/privacidad" className="hover:text-[#FF6B4A] hover:underline">Cómo cuidamos tu privacidad</Link>
            <Link href="/accessibility" className="hover:text-[#FF6B4A] hover:underline">Accesibilidad</Link>
            <Link href="/legal/aviso-legal" className="hover:text-[#FF6B4A] hover:underline">Información al usuario financiero</Link>
            <Link href="/help" className="hover:text-[#FF6B4A] hover:underline">Ayuda</Link>
            <Link href="/defensa-del-consumidor" className="hover:text-[#FF6B4A] hover:underline">Defensa del Consumidor</Link>
            <Link href="/insurance" className="hover:text-[#FF6B4A] hover:underline">Información sobre seguros</Link>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 mt-3">
            <Link href="/complaints" className="hover:text-[#FF6B4A] hover:underline">Libro de quejas online</Link>
            <Link href="/affiliates" className="hover:text-[#FF6B4A] hover:underline">Programa de Afiliados</Link>
          </div>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Copyright © 2026 MadsJeez Commerce Group S.R.L.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Spegazzini / Buenos Aires / Argentina
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
