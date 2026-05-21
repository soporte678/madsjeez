"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import dynamic from "next/dynamic"
import Navbar from "@/components/Navbar"
import Link from "next/link"
const AIRecommendations = dynamic(() => import("@/components/AIRecommendations"), { ssr: false })
const AISmartNotifications = dynamic(() => import("@/components/AISmartNotifications"), { ssr: false })
import { useSession } from "next-auth/react"
import { 
  Search, Bell, Heart, ShoppingCart, Menu, 
  Laptop, Home as HomeIcon, Armchair, Dumbbell, Shirt, 
  Gamepad2, Sparkles, CarFront, ChevronRight,
  CheckCircle2, Check, Star, Truck, ChevronLeft, Zap, 
  ShieldCheck, TrendingUp, Timer, MapPin, 
  CreditCard, Package, Shield, HelpCircle,
  Navigation, Box, Clock, ChevronDown,
  Tv, Utensils, Car, Smartphone, ShoppingBasket, Wrench
} from "lucide-react"
import { useCartStore } from "@/stores/cartStore"
import { createClient } from "@/lib/supabase/client"

const CarouselSkeleton = () => (
  <div className="py-6">
    <div className="h-6 w-48 bg-secondary rounded animate-pulse mb-4" />
    <div className="flex gap-4 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="min-w-[224px] bg-card rounded-lg shadow-sm animate-pulse flex-shrink-0">
          <div className="h-[224px] bg-secondary rounded-t-lg" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-secondary rounded w-3/4" />
            <div className="h-4 bg-secondary rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
)
const ProductCarousel = dynamic(() => import("@/components/ProductCarousel").then(m => ({ default: m.ProductCarousel })), { ssr: false, loading: CarouselSkeleton })
const CategoryCarousel = dynamic(() => import("@/components/CategoryCarousel").then(m => ({ default: m.CategoryCarousel })), { ssr: false })
const RotatingProductCarousel = dynamic(() => import("@/components/RotatingProductCarousel").then(m => ({ default: m.RotatingProductCarousel })), { ssr: false, loading: CarouselSkeleton })

const demoClothing = [
  { id: 'd1', title: '12 Soquetes Medias Unisex Docena Talle Adultos', price: 16999, installments: 'Mismo precio 6 cuotas de $ 2.833', shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=300&q=80' },
  { id: 'd2', title: 'Remera Algodón Premium Oversize Unisex Lisa', price: 24800, installments: 'Mismo precio 6 cuotas de $ 4.133', shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=300&q=80' },
  { id: 'd3', title: 'Zapatillas Urbanas Running Deportivas Unisex', originalPrice: 45000, price: 38250, discount: '15% OFF', shipping: 'Llega mañana', isFlash: true, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80' },
  { id: 'd4', title: 'Campera Rompeviento Impermeable Capucha Hombre', price: 32990, installments: 'Mismo precio 6 cuotas de $ 5.498', shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=300&q=80' },
  { id: 'd5', title: 'Jean Chupin Elastizado Hombre Premium Calidad', price: 27500, shipping: 'Llega gratis mañana', isFlash: true, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?auto=format&fit=crop&w=300&q=80' },
  { id: 'd6', title: 'Mochila Urbana Notebook 17 Pulgadas Impermeable', price: 19900, volumePrice: '$ 18.905 llevando 3 o más', exclusive: true, shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80' },
]

const demoRepurchase = [
  { id: 'r1', title: 'Papel Higiénico Doble Hoja Premium Pack x30', price: 12990, installments: 'Mismo precio 6 cuotas de $ 2.165', shipping: 'Llega gratis mañana', image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=300&q=80' },
  { id: 'r2', title: 'Detergente Concentrado Ropa Pack x3 Litros', price: 8950, volumePrice: '$ 8.500 llevando 5 o más', exclusive: true, shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80' },
  { id: 'r3', title: 'Café Molido Tostado Premium 1kg Colombia', price: 15985, shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=300&q=80' },
  { id: 'r4', title: 'Yerba Mate Orgánica Premium 1kg Pack x2', price: 10494, shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?auto=format&fit=crop&w=300&q=80' },
  { id: 'r5', title: 'Desodorante Antitranspirante Pack x6 Unidades', originalPrice: 19990, price: 18990, discount: '5% OFF', shipping: 'Llega mañana', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=300&q=80' },
]


// Configuración de letras para el logo cinético
const logoLetters = [
  { char: "M", dx: "-30px", dy: "-40px", rot: "-45deg", delay: "0s" },
  { char: "A", dx: "-15px", dy: "40px", rot: "25deg", delay: "0.05s" },
  { char: "D", dx: "20px", dy: "-35px", rot: "-20deg", delay: "0.1s" },
  { char: "S", dx: "35px", dy: "25px", rot: "45deg", delay: "0.15s" },
  { char: "J", dx: "-20px", dy: "35px", rot: "-35deg", delay: "0.2s", isBlue: true },
  { char: "E", dx: "15px", dy: "-45px", rot: "50deg", delay: "0.25s", isBlue: true },
  { char: "E", dx: "30px", dy: "20px", rot: "-15deg", delay: "0.3s", isBlue: true },
  { char: "Z", dx: "45px", dy: "-20px", rot: "35deg", delay: "0.35s", isBlue: true },
]

// Configuración de banners
const heroBanners = [
  {
    id: 1,
    badge: "Lanzamiento 2026",
    titleLine1: "El Nuevo Standard",
    titleLine2: "en compras",
    titleHighlight: "Globales",
    desc: "Tecnología, Moda y Hogar con el respaldo del Commerce Group líder en la región.",
    btn1: "Explorar Colección",
    Icon: ShoppingCart,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=65&fm=webp",
    bgGradient: "from-blue-600 via-slate-900 to-indigo-950",
    accent: "blue"
  },
  {
    id: 2,
    badge: "Ofertas Flash",
    titleLine1: "Descuentos",
    titleLine2: "que cortan la",
    titleHighlight: "Respiración",
    desc: "Hasta 50% de beneficio directo en marcas seleccionadas. Solo por 24 horas.",
    btn1: "Cazar Ofertas",
    Icon: Zap,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=65&fm=webp",
    bgGradient: "from-rose-700 via-slate-900 to-black",
    accent: "rose"
  },
  {
    id: 3,
    badge: "Logística MADSJEEZ",
    titleLine1: "Envío Flash",
    titleLine2: "Cómpralo hoy,",
    titleHighlight: "Recíbelo hoy",
    desc: "Nuestra propia flota logística garantiza la entrega en menos de 24hs con seguimiento en tiempo real.",
    btn1: "Saber más",
    Icon: Truck,
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=900&q=65&fm=webp", 
    bgGradient: "from-emerald-800 via-slate-900 to-black",
    accent: "emerald",
    isLogistics: true
  },
  {
    id: 4,
    badge: "Ecosistema Gamer",
    titleLine1: "Equipa tu",
    titleLine2: "victoria con",
    titleHighlight: "High Tech",
    desc: "Hardware de última generación con cuotas fijas y garantía extendida oficial.",
    btn1: "Ver Setup",
    Icon: Gamepad2,
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=65&fm=webp",
    bgGradient: "from-purple-800 via-slate-900 to-indigo-950",
    accent: "purple"
  },
  {
    id: 5,
    badge: "Market Insights",
    titleLine1: "Potenciamos",
    titleLine2: "tu marca al",
    titleHighlight: "Infinito",
    desc: "Vende en la plataforma de mayor crecimiento. Dashboard avanzado y logística integrada.",
    btn1: "Ser Vendedor Pro",
    Icon: TrendingUp,
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=900&q=65&fm=webp",
    bgGradient: "from-amber-600 via-slate-900 to-black",
    accent: "amber"
  },
  {
    id: 6,
    badge: "Seguridad Bancaria",
    titleLine1: "Transacciones",
    titleLine2: "con Blindaje Digital",
    titleHighlight: "Protección Élite",
    desc: "Comprá tranquilo. Tu dinero está protegido por protocolos de seguridad de alta gama.",
    btn1: "Centro de Confianza",
    Icon: ShieldCheck,
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=65&fm=webp",
    bgGradient: "from-slate-700 via-slate-900 to-blue-950",
    accent: "slate"
  }
]

export default function Home() {
  const { data: session } = useSession()
  const { getTotalItems } = useCartStore()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const cartItemsCount = getTotalItems()
  const [products, setProducts] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 5 ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      const supabase = createClient()
      const { data: prods } = await supabase
        .from('products')
        .select('id, title, price, original_price, free_shipping, sales, product_images(url, is_primary)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12)

      if (prods) {
        const mapped = prods.map((p: any) => ({
          id: p.id,
          title: p.title,
          price: p.price,
          original_price: p.original_price,
          free_shipping: p.free_shipping,
          sales: p.sales || 0,
          image: p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || null,
        }))
        setProducts(mapped.slice(0, 6))
        setRecentProducts(mapped.slice(6, 12))
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-black overflow-hidden h-[550px] md:h-[700px] flex items-center group pb-16 md:pb-24">
        {heroBanners.map((banner, index) => {
          const isActive = currentSlide === index
          const isAdjacent = index === (currentSlide + 1) % heroBanners.length
          if (!isActive && !isAdjacent) return null
          return (
          <div 
            key={banner.id} 
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              isActive ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-12 pointer-events-none"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`}></div>
            {isActive && <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[80px]"></div>}
            <div className="absolute inset-0 bg-pattern opacity-[0.15]"></div>

            <div className="max-w-7xl mx-auto px-4 h-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-20">
              <div className="w-full md:w-3/5 text-left pt-6 md:pt-0">
                <div className="glass-panel inline-flex items-center gap-2 px-5 py-2 rounded-full text-white font-bold text-[11px] tracking-[0.3em] uppercase mb-4 shadow-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]"></span>
                  {banner.badge}
                </div>
                
                <h1 className="text-5xl md:text-[5rem] font-black text-white tracking-tighter leading-[0.88] uppercase font-montserrat drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                  {banner.titleLine1} <br/>
                  <span className="text-white/40">{banner.titleLine2}</span> <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-500 inline-block mt-2">
                    {banner.titleHighlight}
                  </span>
                </h1>
                
                <p className="mt-6 text-lg text-white/70 font-medium max-w-lg leading-relaxed hidden md:block">
                  {banner.desc}
                </p>
                
                <Link 
                  href={banner.id === 5 ? "/seller/register" : "/search"}
                  className="mt-8 group/btn bg-gradient-to-r from-[#ff4d2e] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white text-[14px] font-black py-4 px-10 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-2 inline-flex items-center gap-4 uppercase tracking-wider btn-shine"
                >
                  {banner.btn1}
                  <div className="w-8 h-8 rounded-full bg-white text-[#ff4d2e] flex items-center justify-center group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </Link>
              </div>

              <div className="hidden lg:flex relative w-1/2 h-[80%] items-center justify-end">
                <div className="relative w-[480px] h-[520px] glass-panel p-4 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-1000 group-hover:scale-[1.02]">
                  <div className="relative w-full h-full rounded-[2.8rem] overflow-hidden bg-slate-900">
                    <Image 
                      src={banner.image} 
                      fill 
                      className="object-cover transform scale-105 group-hover:scale-110 transition-transform duration-[15s]" 
                      alt={`Banner MadsJeez: ${banner.titleLine1} ${banner.titleHighlight}`}
                      priority={index === 0}
                      sizes="480px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                    
                    {banner.isLogistics && (
                      <div className="absolute top-[30%] left-[10%] w-64 p-6 bg-yellow-400 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-b-[6px] border-yellow-600 flex flex-col items-center justify-center transform -rotate-12 floating-ui z-30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-montserrat font-black text-slate-900 text-xl tracking-tighter uppercase">MADS<span className="text-blue-700">JEEZ</span></span>
                        </div>
                        <div className="w-full h-px bg-slate-900/10 mb-3"></div>
                        <div className="flex items-center gap-2 text-[12px] font-black text-slate-800 uppercase tracking-widest">
                          <Truck size={16} className="text-blue-600" /> Express Logística
                        </div>
                      </div>
                    )}
                  </div>

                  {banner.isLogistics && (
                    <>
                      <div className="absolute -left-12 bottom-12 glass-panel px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 floating-ui z-40" style={{animationDelay: "1s"}}>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Navigation size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">Entrega en Curso</span>
                          <span className="text-white font-black text-sm">ZONA: SPEGAZZINI</span>
                        </div>
                      </div>
                      <div className="absolute -right-6 top-8 glass-panel px-5 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-1 floating-ui z-40" style={{animationDelay: "0.5s"}}>
                        <Clock size={28} className="text-yellow-400 mb-1" />
                        <span className="text-[18px] text-white font-black leading-none">Hoy</span>
                        <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">En tu puerta</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          )
        })}
        
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[50]">
          {heroBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ver slide ${index + 1}`}
              className={`transition-all duration-700 rounded-full ${
                currentSlide === index 
                  ? "w-16 h-2 bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]" 
                  : "w-3 h-2 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </section>

      {/* QUICK ACCESS CARDS */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-50 mb-16">
        <div className="bg-white rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 border border-slate-200/50">
          {[
            { title: "Medios de pago", icon: CreditCard, color: "text-blue-600", desc: "Hasta 18 cuotas" },
            { title: "Bajo costo", icon: Zap, color: "text-yellow-500", desc: "Menos de $30.000" },
            { title: "Best Sellers", icon: TrendingUp, color: "text-emerald-500", desc: "Top del mes" },
            { title: "Protección", icon: ShieldCheck, color: "text-blue-600", desc: "Compra segura" },
          ].map((item, index) => (
            <Link 
              key={index} 
              href="/search"
              className="flex items-center gap-5 p-6 hover:bg-slate-50 transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-500">
                <item.icon size={28} className={item.color} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[16px] text-slate-800 leading-tight">{item.title}</span>
                <span className="text-[13px] text-slate-500 font-medium mt-1">{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MADS PRO BANNER */}
      <section className="max-w-[1184px] mx-auto px-4 mb-10">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 border-b border-border gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#db2777] to-[#ec4899] text-white px-4 py-1.5 rounded-full font-black italic text-lg tracking-tight shadow-lg shadow-pink-500/30 animate-pulse-glow">
                mads+
              </div>
              <span className="font-bold text-[15px] text-card-foreground">VIVÍ MADSJEEZ COMO UN EXPERTO</span>
            </div>
            <Link href="/subscriptions" className="bg-gradient-to-r from-[#ff4d2e] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-1 btn-shine">
              Suscribirme desde $ 3.490
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {[
              { Icon: Package, color: 'text-[#a90f90]', bg: 'bg-pink-50', text: 'Envíos gratis en productos desde $ 16.000' },
              { Icon: Tv, color: 'text-[#3483fa]', bg: 'bg-blue-50', text: 'Las mejores plataformas de entretenimiento' },
              { Icon: CreditCard, color: 'text-[#a90f90]', bg: 'bg-purple-50', text: 'Hasta 3 cuotas extra en tus compras' },
              { Icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50', text: 'Envíos gratis en pedidos de Restaurantes' },
            ].map((item, idx) => (
              <div key={idx} className={`flex flex-col items-center text-center group cursor-pointer ${idx > 0 ? 'border-l border-border' : ''}`}>
                <div className="w-24 h-24 mb-4 relative flex justify-center items-center">
                  <div className={`absolute inset-0 ${item.bg} rounded-full scale-0 group-hover:scale-100 transition-transform duration-300`}></div>
                  <item.Icon className={`w-12 h-12 ${item.color} relative z-10`} />
                </div>
                <p className="text-[13px] text-card-foreground font-medium px-4 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. CARRUSEL: Productos rotativos - Cambia cada 1 minuto */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Productos destacados"
          subtitle="Descubrí nuevos productos de nuestro catálogo"
        />
      </section>

      {/* 2. CARRUSEL: Relacionado con tus visitas (datos reales) */}
      <section className="max-w-[1184px] mx-auto px-4">
        <ProductCarousel
          title="Relacionado con tus visitas"
          products={products}
        />
      </section>

      {/* 3. CARRUSEL: Elegidos para vos (datos reales) */}
      <section className="max-w-[1184px] mx-auto px-4">
        <ProductCarousel
          title="Elegidos para vos"
          products={recentProducts}
        />
      </section>

      {/* 4. CARRUSEL: Pensados para vos en Ropa */}
      <section className="max-w-[1184px] mx-auto px-4">
        <ProductCarousel
          title="Pensados para vos en Ropa y Accesorios"
          products={demoClothing}
        />
      </section>

      {/* 5. CARRUSEL: Vuelven a comprar */}
      <section className="max-w-[1184px] mx-auto px-4">
        <ProductCarousel
          title="Productos que otras personas vuelven a comprar"
          products={demoRepurchase}
        />
      </section>

      {/* 6. CARRUSEL: Más productos rotativos */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Más productos para vos"
          subtitle="Nuestra selección se renueva automáticamente"
          offset={12}
        />
      </section>

      {/* 5. CATEGORÍAS (Grilla 3 filas con scroll) */}
      <section className="max-w-[1184px] mx-auto px-4">
        <CategoryCarousel />
      </section>

      {/* 6. CARRUSEL: También puede interesarte */}
      <section className="max-w-[1184px] mx-auto px-4">
        <ProductCarousel
          title="También puede interesarte"
          products={[...demoClothing].reverse()}
        />
      </section>

      {/* BANNERS PROMOCIONALES */}
      <section className="max-w-[1184px] mx-auto px-4 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-card rounded shadow-sm flex overflow-hidden cursor-pointer group hover:shadow-md transition-shadow h-[250px] border border-border">
            <div className="w-1/2 p-8 flex flex-col justify-center text-card-foreground">
              <span className="text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2 uppercase">Organizá mejor</span>
              <h3 className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">MÁS ESPACIO Y<br/>ORDEN PRÁCTICO</h3>
              <Link href="/search" className="bg-gradient-to-r from-[#ff4d2e] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-0.5 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <Image src="https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=400" alt="Organizadores y muebles de almacenamiento para el hogar" fill className="object-cover transform group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
          <div className="flex-1 bg-card rounded shadow-sm flex overflow-hidden cursor-pointer group hover:shadow-md transition-shadow h-[250px] border border-border">
            <div className="w-1/2 p-8 flex flex-col justify-center text-card-foreground">
              <span className="text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2 uppercase">Renová tu hogar</span>
              <h3 className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">¡HOGAR Y MUEBLES!<br/>HASTA 35% OFF</h3>
              <Link href="/search" className="bg-gradient-to-r from-[#ff4d2e] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-0.5 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <Image src="https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=400" alt="Muebles y sillas para el hogar con descuento" fill className="object-cover transform group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* PLANES DE VENDEDOR */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-20 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            ¿LISTO PARA <span className="bg-gradient-to-r from-[#ff4d2e] via-[#ffb703] to-[#00b4d8] bg-clip-text text-transparent">ESCALAR?</span>
          </h2>
          <p className="text-slate-200/95 text-sm md:text-base font-light leading-relaxed max-w-xl mx-auto">
            Únete a la red Commerce Group más avanzada. Herramientas de grado empresarial para marcas que no conocen fronteras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1100px] mx-auto items-center">
          {[
            {
              name: "PLATA", price: "9.999", comm: "12%", icon: Box, featured: false,
              benefits: [
                'Exposición estándar en búsquedas',
                'Hasta 100 publicaciones activas',
                'Marketing IA: 10 posts/mes (Instagram + Facebook)',
                'WhatsApp Business API: 500 mensajes/mes',
                'Panel de métricas básicas',
                'Acceso a MadsEnvíos'
              ]
            },
            {
              name: "GOLD", price: "19.999", comm: "8%", icon: Zap, featured: true,
              benefits: [
                'Exposición alta en resultados',
                'Publicaciones ilimitadas',
                'Marketing IA ilimitado: posts, emails, banners, SEO',
                'Meta API completa: Instagram + Facebook + WhatsApp',
                'TikTok Shop integrado + posts automatizados',
                'Soporte prioritario por WhatsApp',
                'Panel de métricas avanzado',
                'Descuentos en costos de envío'
              ]
            },
            {
              name: "PLATINUM", price: "49.999", comm: "5%", icon: Sparkles, featured: false,
              benefits: [
                'Exposición máxima (Top Resultados)',
                'Publicidad en Banners (Home y Categorías)',
                'IA Premium: generación de video, voz, chatbot personalizado',
                'Meta API Enterprise: Instagram, Facebook, WhatsApp + Ads Manager',
                'TikTok Ads + TikTok Shop + viralizador IA',
                'Ejecutivo de cuenta dedicado',
                'Comisión más baja garantizada',
                'Retiro de dinero inmediato'
              ]
            }
          ].map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 transition-all duration-500 hover:-translate-y-2 ${
                plan.featured
                  ? 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-2 border-[#ffb703] shadow-[0_0_40px_rgba(255,193,7,0.3)] md:-mt-8 md:mb-8 animate-pulse-glow-yellow'
                  : 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border border-slate-700 hover:border-[#ff4d2e]/50 hover:shadow-[0_0_30px_rgba(255,107,74,0.15)]'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#ffb703] to-[#ffa60a] text-slate-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg">
                  Más Popular
                </div>
              )}

              <div className="flex flex-col items-center text-center mb-8 border-b border-slate-700/60 pb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  plan.featured
                    ? 'bg-gradient-to-br from-[#ffb703] to-[#ffa60a] shadow-lg shadow-yellow-500/30'
                    : plan.name === 'PLATINUM'
                    ? 'bg-gradient-to-br from-[#00b4d8] to-[#0096c7] shadow-lg shadow-cyan-500/30'
                    : 'bg-gradient-to-br from-[#ff4d2e] to-[#ff9100] shadow-lg shadow-orange-500/30'
                }`}>
                  <plan.icon className={`w-8 h-8 ${plan.featured ? 'text-slate-900' : 'text-white'}`} />
                </div>
                <h3 className={`text-xl font-black mb-2 ${plan.featured ? 'text-[#ffb703]' : plan.name === 'PLATINUM' ? 'text-[#00b4d8]' : 'text-[#ff4d2e]'}`}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-300 text-sm">/mes</span>
                </div>
                <div className={`text-xs font-black py-1.5 px-4 rounded-full ${
                  plan.featured
                    ? 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]/30'
                    : plan.name === 'PLATINUM'
                    ? 'bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/30'
                    : 'bg-[#ff4d2e]/20 text-[#ff4d2e] border border-[#ff4d2e]/30'
                }`}>
                  {plan.comm} COMISIÓN
                </div>
              </div>

              <ul className="flex flex-col gap-4 mb-8 flex-grow">
                {plan.benefits.map((b: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-1 ${
                      plan.featured
                        ? 'bg-[#ffb703]/20 text-[#ffb703]'
                        : plan.name === 'PLATINUM'
                        ? 'bg-[#00b4d8]/20 text-[#00b4d8]'
                        : 'bg-[#ff4d2e]/20 text-[#ff4d2e]'
                    }`}>
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm text-slate-300 leading-tight">{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/subscriptions"
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 text-center btn-shine ${
                  plan.featured
                    ? 'bg-gradient-to-r from-[#ffb703] to-[#ffa60a] text-slate-900 shadow-lg shadow-yellow-500/40 hover:shadow-xl hover:shadow-yellow-500/60 hover:-translate-y-0.5'
                    : plan.name === 'PLATINUM'
                    ? 'bg-gradient-to-r from-[#00b4d8] to-[#0096c7] text-slate-900 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/50 hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-[#ff4d2e] to-[#ff9100] text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 hover:-translate-y-0.5'
                }`}
              >
                SELECCIONAR
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* MÓDULO DE CONFIANZA */}
      <section className="bg-white py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { icon: CreditCard, title: "Pagos Certificados", desc: "Blindaje digital de nivel bancario para cada transacción. Crédito instantáneo sin tarjeta.", color: "from-[#ff4d2e] to-[#ff9100]", shadow: "shadow-orange-500/30" },
            { icon: Truck, title: "Logística Inteligente", desc: "Tu pedido siempre localizado. Red de entrega Flash con monitoreo 24/7.", color: "from-[#00b4d8] to-[#0096c7]", shadow: "shadow-cyan-500/30" },
            { icon: ShieldCheck, title: "Compra Protegida", desc: "Garantía total de satisfacción. Si no es lo que esperabas, lo resolvemos en el acto.", color: "from-[#10b981] to-[#059669]", shadow: "shadow-lime-500/30" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group cursor-pointer">
              <div className={`w-20 h-20 rounded-[2.5rem] bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <item.icon size={36} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter group-hover:text-[#ff4d2e] transition-colors">{item.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI RECOMMENDATIONS */}
      <section className="bg-white py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <AIRecommendations />
        </div>
      </section>

      {/* SMART NOTIFICATIONS */}
      <AISmartNotifications />

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] pt-20 pb-10 border-t-[10px] border-[#ff4d2e]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <span className="font-montserrat font-black text-2xl tracking-tighter uppercase text-white">MADS<span className="text-[#ff4d2e]">JEEZ</span></span>
              </div>
              <p className="text-slate-400 font-medium text-sm max-w-sm leading-relaxed mb-8">
                La plataforma definitiva para el comercio del siglo XXI. Innovación, velocidad y seguridad en cada clic.
              </p>
            </div>
            {[
              { title: "Marketplace", links: ["Ayuda", "Servicios VIP", "Contacto"] },
              { title: "Ecosistema", links: ["Vender", "Suscripciones", "Impulsar"] },
              { title: "Legales", links: ["Términos", "Privacidad", "Aviso Legal"] }
            ].map((section) => (
              <div key={section.title}>
                <h5 className="font-black text-[#ff4d2e] uppercase tracking-widest text-[11px] mb-6">{section.title}</h5>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link
                        href={link === "Términos" ? "/legal/terminos" : link === "Privacidad" ? "/legal/privacidad" : link === "Aviso Legal" ? "/legal/aviso-legal" : link === "Vender" ? "/seller/register" : link === "Suscripciones" ? "/subscriptions" : link === "Impulsar" ? "/seller/boost" : "/"}
                        className="text-[13px] font-bold text-slate-400 hover:text-[#00b4d8] transition-colors cursor-pointer"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-700 pt-10 text-[11px] font-black text-slate-500 tracking-widest">
            <span className="text-slate-400">COPYRIGHT © 2026 MADSJEEZ COMMERCE GROUP S.R.L.</span>
            <div className="flex gap-8">
              <span className="text-slate-400">SPEGAZZINI / BUENOS AIRES / ARG</span>
              <Link href="/legal/aviso-legal" className="text-[#ff4d2e] hover:text-[#ffb703] transition-colors">DATA FISCAL</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
