"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { 
  Search, Bell, Heart, ShoppingCart, Menu, 
  Laptop, Home as HomeIcon, Armchair, Dumbbell, Shirt, 
  Gamepad2, Sparkles, CarFront, ChevronRight,
  CheckCircle2, Star, Truck, ChevronLeft, Zap, 
  ShieldCheck, TrendingUp, Timer, MapPin, 
  CreditCard, Package, Shield, HelpCircle,
  Navigation, Box, Clock
} from "lucide-react"
import { useCartStore } from "@/stores/cartStore"
import { ProductCard } from "@/components/ProductCard"

// Datos de productos destacados - Estilo Mercado Libre
const productosDestacados = [
  {
    id: "1",
    title: "Auriculares Inalámbricos Bluetooth Sony WH-1000XM4 Cancelación Ruido",
    price: 125000,
    originalPrice: 150000,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80",
    seller: "TechStore Official",
    rating: 4.8,
    sales: 234,
    freeShipping: true,
    installments: "6x $20.833"
  },
  {
    id: "2",
    title: "Smart TV Samsung 55\" 4K UHD Crystal Processor HDR",
    price: 450000,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=500&q=80",
    seller: "ElectroHogar SA",
    rating: 4.9,
    sales: 512,
    freeShipping: true,
    installments: "12x $37.500"
  },
  {
    id: "3",
    title: "Zapatillas Nike Air Max 270 Running Hombre Negras",
    price: 85000,
    originalPrice: 95000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80",
    seller: "SportLife Store",
    rating: 4.5,
    sales: 189,
    freeShipping: false,
    installments: "3x $28.333"
  },
  {
    id: "4",
    title: "Silla Gamer Ergonómica DXRacer Formula Series Reclinable",
    price: 190000,
    originalPrice: 220000,
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=500&q=80",
    seller: "GamingZone",
    rating: 4.7,
    sales: 156,
    freeShipping: true,
    installments: "6x $31.667"
  },
  {
    id: "5",
    title: "Smartphone 128GB 5G Cámara Dual",
    price: 320000,
    originalPrice: 350000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=500&q=80",
    seller: "TechMobile Store",
    rating: 4.6,
    sales: 298,
    freeShipping: true,
    installments: "12x $26.667"
  },
  {
    id: "6",
    title: "Tablet 10\" 64GB WiFi",
    price: 180000,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=500&q=80",
    seller: "TabletWorld",
    rating: 4.4,
    sales: 87,
    freeShipping: true,
    installments: "6x $30.000"
  },
  {
    id: "7",
    title: "Laptop Gaming Intel Core i7 RTX 3060",
    price: 550000,
    originalPrice: 600000,
    image: "https://images.unsplash.com/photo-1593642632827-cf2a2e98e5f8?auto=format&fit=crop&w=500&q=80",
    seller: "PCMaster",
    rating: 4.9,
    sales: 423,
    freeShipping: true,
    installments: "12x $45.833"
  },
  {
    id: "8",
    title: "Reloj Smartwatch Fitness Tracker",
    price: 95000,
    originalPrice: null,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80",
    seller: "WearTech",
    rating: 4.3,
    sales: 134,
    freeShipping: false,
    installments: "3x $31.667"
  }
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
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=1200&q=80", 
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
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=1200&q=80",
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
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1200&q=80",
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === 5 ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <main className="min-h-screen bg-[#F0F0F0] font-outfit text-slate-900 overflow-x-hidden">
      {/* HEADER */}
      <header className="bg-yellow-400 pt-3 pb-2 px-4 shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-8 md:gap-12">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-4 cursor-pointer group flex-shrink-0">
              <div className="relative w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 group-hover:shadow-blue-500/20 transition-all overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent"></div>
                <svg viewBox="0 0 100 100" className="w-10 h-10 overflow-visible">
                  <defs>
                    <linearGradient id="logoBlue" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563EB" /> 
                      <stop offset="100%" stopColor="#60A5FA" /> 
                    </linearGradient>
                    <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FACC15" /> 
                      <stop offset="100%" stopColor="#F59E0B" /> 
                    </linearGradient>
                  </defs>
                  <g className="transition-all duration-700 ease-out group-hover:scale-110">
                    <polygon points="15,80 35,30 55,55 35,80" fill="url(#logoBlue)" className="opacity-90" />
                    <polygon points="55,55 75,30 95,80 75,80" fill="url(#logoBlue)" className="opacity-90" />
                    <path d="M 85 80 L 65 30 L 45 65" fill="none" stroke="url(#logoGold)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </svg>
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-montserrat font-black text-[28px] tracking-tighter leading-none flex items-center uppercase overflow-hidden shimmer-text">
                  {logoLetters.map((letter, i) => (
                    <span 
                      key={i} 
                      className={`letter-piece ${letter.isBlue ? "text-blue-700" : "text-slate-900"}`}
                      style={{"--dx": letter.dx, "--dy": letter.dy, "--rot": letter.rot, animationDelay: letter.delay} as React.CSSProperties}
                    >
                      {letter.char}
                    </span>
                  ))}
                </span>
                <span className="font-montserrat text-[9px] font-black tracking-[0.45em] text-slate-700 uppercase mt-0.5 opacity-80">
                  Commerce Group
                </span>
              </div>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-4xl relative group">
              <input 
                type="text" 
                placeholder="Busca productos, servicios y marcas exclusivas..." 
                className="w-full py-3.5 px-6 pr-14 rounded-xl border-0 shadow-lg bg-white focus:ring-4 focus:ring-blue-600/10 transition-all outline-none text-slate-800 font-medium text-[16px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                <div className="h-6 w-px bg-slate-200 mr-4"></div>
                <Search size={22} className="text-slate-400 group-focus-within:text-blue-600 transition-colors cursor-pointer" />
              </div>
            </form>

            {/* Pro Badge */}
            <Link href="/subscriptions" className="hidden xl:flex items-center gap-3 bg-slate-900 text-white pl-2 pr-6 py-2 rounded-2xl shadow-xl hover:scale-105 transition-transform cursor-pointer border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-slate-900 font-black italic">M+</div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest leading-none mb-1">Suscribite a</span>
                <span className="text-[13px] font-black italic leading-none text-yellow-400">MADSJEEZ PRO</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 text-[13px] font-medium text-slate-800/80">
            <div className="hidden md:flex items-center gap-2 p-1.5 rounded-lg hover:bg-black/5 cursor-pointer transition-colors border border-transparent hover:border-black/5">
              <MapPin size={22} className="text-slate-900" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] opacity-60 font-bold uppercase">Enviar a</span>
                <span className="text-[13px] font-extrabold">Spegazzini 1812</span>
              </div>
            </div>

            <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide flex-1 md:justify-center">
              {["Categorías", "Ofertas", "Historial", "Supermercado", "Moda", "Vender", "Ayuda"].map((link) => (
                <Link 
                  key={link} 
                  href={link === "Categorías" ? "/categories" : link === "Vender" ? "/seller/register" : "/"}
                  className="hover:text-blue-700 transition-colors whitespace-nowrap font-semibold"
                >
                  {link === "Categorías" && <Menu size={16} className="inline mr-1 mb-0.5" />}
                  {link}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-6 font-bold">
              {!session ? (
                <>
                  <Link href="/auth/register" className="hover:text-blue-700 transition-colors">Creá tu cuenta</Link>
                  <Link href="/auth/login" className="hover:text-blue-700 transition-colors">Ingresá</Link>
                </>
              ) : (
                <Link href="/account" className="hover:text-blue-700 transition-colors">{session.user?.name || "Mi cuenta"}</Link>
              )}
              <div className="flex items-center gap-5 ml-4 pl-6 border-l border-slate-900/10">
                <Bell size={20} className="cursor-pointer hover:text-blue-700 transition-colors" />
                <Link href="/cart" className="relative cursor-pointer hover:text-blue-700 transition-colors">
                  <ShoppingCart size={20} />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-blue-600 text-white text-[10px] font-black h-[18px] w-[18px] flex items-center justify-center rounded-full border-2 border-yellow-400">
                      {cartItemsCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative bg-black overflow-hidden h-[550px] md:h-[700px] flex items-center group pb-16 md:pb-24">
        {heroBanners.map((banner, index) => (
          <div 
            key={banner.id} 
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              currentSlide === index ? "opacity-100 z-10 translate-x-0" : "opacity-0 z-0 translate-x-12 pointer-events-none"
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`}></div>
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-yellow-500/5 blur-[120px]"></div>
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
                  className="mt-8 group/btn bg-white hover:bg-yellow-400 text-slate-900 text-[14px] font-black py-4 px-10 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-2 inline-flex items-center gap-4 uppercase tracking-wider"
                >
                  {banner.btn1}
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover/btn:scale-110 transition-transform">
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
                      alt={banner.badge}
                      unoptimized
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
        ))}
        
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[50]">
          {heroBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
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

      {/* PRODUCTOS DESTACADOS */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase font-montserrat">
            Basado en <span className="text-blue-600">tu historial</span>
          </h2>
          <Link href="/search" className="text-blue-600 font-bold hover:underline text-sm uppercase tracking-widest">Ver más productos</Link>
        </div>
        
        {/* Grid de productos destacados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosDestacados.map((producto) => (
            <ProductCard key={producto.id} {...producto} />
          ))}
        </div>
      </section>

      {/* PLANES DE VENDEDOR */}
      <section className="bg-slate-950 py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-[0.05]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-full bg-blue-600/10 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter font-montserrat uppercase mb-6">
            ¿Listo para <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Escalar?</span>
          </h2>
          <p className="text-xl text-white/50 font-medium max-w-2xl mx-auto mb-20 leading-relaxed">
            Únete a la red Commerce Group más avanzada. Herramientas de grado empresarial para marcas que no conocen fronteras.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Plata", price: "$9.999", comm: "12% Comisión", icon: Box },
              { name: "Gold", price: "$19.999", comm: "8% Comisión", featured: true, icon: Zap },
              { name: "Platinum", price: "$49.999", comm: "5% Comisión", icon: Sparkles }
            ].map((plan) => (
              <Link 
                href="/subscriptions"
                key={plan.name} 
                className={`group relative p-10 pb-28 rounded-[3rem] border transition-all duration-700 hover:-translate-y-4 ${
                  plan.featured 
                    ? "bg-gradient-to-b from-slate-800 to-slate-900 border-yellow-500/30 shadow-[0_0_60px_-15px_rgba(234,179,8,0.3)] md:scale-110 z-20" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                {plan.featured && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-yellow-400 rounded-full blur-sm opacity-50"></div>}
                <plan.icon size={48} className={plan.featured ? "text-yellow-400 mx-auto mb-8" : "text-white/20 mx-auto mb-8"} strokeWidth={1} />
                <h3 className={`text-2xl font-black font-montserrat uppercase mb-2 ${plan.featured ? "text-yellow-400" : "text-white"}`}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-8">
                  <span className="text-6xl font-black text-white tracking-tighter">{plan.price}</span>
                  <span className="text-white/40 font-bold">/mes</span>
                </div>
                <div className={`inline-block px-4 py-2 rounded-2xl font-black text-[11px] uppercase tracking-widest mb-10 ${
                  plan.featured ? "bg-yellow-400 text-slate-900" : "bg-white/10 text-white"
                }`}>
                  {plan.comm}
                </div>
                <div className={`absolute bottom-10 left-10 right-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] text-center transition-all ${
                  plan.featured ? "bg-yellow-400 text-slate-900 shadow-2xl hover:bg-white" : "bg-white text-slate-900 hover:bg-blue-600 hover:text-white"
                }`}>
                  Seleccionar
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULO DE CONFIANZA */}
      <section className="bg-white py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { icon: CreditCard, title: "Pagos Certificados", desc: "Blindaje digital de nivel bancario para cada transacción. Crédito instantáneo sin tarjeta." },
            { icon: Truck, title: "Logística Inteligente", desc: "Tu pedido siempre localizado. Red de entrega Flash con monitoreo 24/7." },
            { icon: ShieldCheck, title: "Compra Protegida", desc: "Garantía total de satisfacción. Si no es lo que esperabas, lo resolvemos en el acto." }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group">
              <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 flex items-center justify-center text-blue-600 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                <item.icon size={36} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter">{item.title}</h4>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#EBEBEB] pt-20 pb-10 border-t-[10px] border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <span className="font-montserrat font-black text-2xl tracking-tighter uppercase">MADS<span className="text-blue-600">JEEZ</span></span>
              </div>
              <p className="text-slate-500 font-bold text-sm max-w-sm leading-relaxed mb-8">
                La plataforma definitiva para el comercio del siglo XXI. Innovación, velocidad y seguridad en cada clic.
              </p>
            </div>
            {[
              { title: "Marketplace", links: ["Ayuda", "Servicios VIP", "Contacto"] },
              { title: "Ecosistema", links: ["Vender", "Suscripciones", "Impulsar"] },
              { title: "Legales", links: ["Términos", "Privacidad", "Aviso Legal"] }
            ].map((section) => (
              <div key={section.title}>
                <h5 className="font-black text-slate-900 uppercase tracking-widest text-[11px] mb-6">{section.title}</h5>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link 
                        href={link === "Términos" ? "/legal/terminos" : link === "Privacidad" ? "/legal/privacidad" : link === "Aviso Legal" ? "/legal/aviso-legal" : link === "Vender" ? "/seller/register" : link === "Suscripciones" ? "/subscriptions" : link === "Impulsar" ? "/seller/boost" : "/"}
                        className="text-[13px] font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-300 pt-10 text-[11px] font-black text-slate-400 tracking-widest">
            <span>COPYRIGHT © 2026 MADSJEEZ COMMERCE GROUP S.R.L.</span>
            <div className="flex gap-8">
              <span>SPEGAZZINI / BUENOS AIRES / ARG</span>
              <Link href="/legal/aviso-legal" className="text-slate-900 hover:text-blue-600">DATA FISCAL</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
