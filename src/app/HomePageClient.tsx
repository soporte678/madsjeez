"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Navbar from "@/components/Navbar"
import { HomeSeoContent } from "@/components/home/HomeSeoContent"
import { HomeSocialProof } from "@/components/home/HomeSocialProof"
import { SiteCompanyFooter } from "@/components/seo/SiteCompanyFooter"
import { SiteSocialFooter } from "@/components/seo/SiteSocialFooter"
import { COMPANY } from "@/lib/company"
import Link from "next/link"
import {
  ShoppingCart,
  Gamepad2,
  Sparkles,
  ChevronRight,
  Check,
  Truck,
  Zap,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Package,
  Navigation,
  Box,
  Clock,
  Tv,
  Utensils,
  Store,
  Building2,
  Rocket,
  ShoppingBag,
  Users,
} from "lucide-react"
const AIRecommendations = dynamic(() => import("@/components/AIRecommendations"), {
  ssr: false,
  loading: () => null,
})
const CategoryCarousel = dynamic(
  () => import("@/components/CategoryCarousel").then((m) => m.CategoryCarousel),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> }
)
const RotatingProductCarousel = dynamic(
  () => import("@/components/RotatingProductCarousel").then((m) => m.RotatingProductCarousel),
  { loading: () => <div className="h-48 animate-pulse rounded-xl bg-slate-100 mb-8" /> }
)
const PaidAdBannerSlot = dynamic(
  () => import("@/components/ads/PaidAdBannerSlot").then((m) => m.PaidAdBannerSlot),
  { loading: () => <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> }
)

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
    desc: "La plataforma para vender productos y gestionar tu negocio online en Argentina. Catálogo, ofertas y pagos con Mercado Pago.",
    btn1: "Explorar Colección",
    Icon: ShoppingCart,
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Compradores en un local comercial moderno — marketplace Madsjeez Argentina",
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
    imageAlt: "Etiquetas de ofertas y descuentos en productos — ofertas flash Madsjeez",
    bgGradient: "from-orange-900 via-slate-900 to-black",
    accent: "orange"
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
    imageAlt: "Camión de logística en ruta — envío express Madsjeez en 24 horas",
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
    imageAlt: "Setup gamer con periféricos de alta gama — categoría gaming Madsjeez",
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
    imageAlt: "Equipo de negocios en reunión — vender y escalar tu marca en Madsjeez",
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
    imageAlt: "Pago seguro con tarjeta y protección digital — compra protegida Madsjeez",
    bgGradient: "from-slate-700 via-slate-900 to-blue-950",
    accent: "slate"
  }
]

export default function HomePageClient() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const heroSlideCount = heroBanners.length

  useEffect(() => {
    if (heroSlideCount <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev >= heroSlideCount - 1 ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [heroSlideCount])

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* HERO — un solo H1 con "marketplace"; carrusel = fondo + H2 */}
      <section
        className="relative bg-black overflow-hidden h-[550px] md:h-[700px] flex items-center group pb-16 md:pb-24"
        aria-labelledby="home-marketplace-h1"
      >
        {heroBanners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              currentSlide === index
                ? "opacity-100 z-10 translate-x-0"
                : "opacity-0 z-0 translate-x-12 pointer-events-none"
            }`}
            aria-hidden={currentSlide !== index}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`} />
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[150px] hidden md:block" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-yellow-500/5 blur-[120px] hidden md:block" />
            <div className="absolute inset-0 bg-pattern opacity-[0.15]" />
          </div>
        ))}

        {(() => {
          const banner = heroBanners[currentSlide]
          return (
            <div className="max-w-7xl mx-auto px-4 h-full w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-20">
              <div className="w-full md:w-3/5 text-left pt-6 md:pt-0">
                <div className="glass-panel inline-flex items-center gap-2 px-5 py-2 rounded-full text-white font-bold text-[11px] tracking-[0.3em] uppercase mb-4 shadow-2xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
                  {banner.badge}
                </div>

                <h1
                  id="home-marketplace-h1"
                  className="text-3xl md:text-5xl font-black text-white tracking-tight leading-[1.05] font-montserrat drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-500">
                    Marketplace
                  </span>{" "}
                  en Argentina — MadsJeez
                </h1>

                <h2 className="mt-4 text-4xl md:text-[3.25rem] font-black text-white/90 tracking-tighter leading-[0.88] uppercase font-montserrat">
                  {banner.titleLine1} <br />
                  <span className="text-white/40">{banner.titleLine2}</span> <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-500 inline-block mt-2">
                    {banner.titleHighlight}
                  </span>
                </h2>

                <p className="mt-6 text-base md:text-lg text-white/85 font-medium max-w-lg leading-relaxed">
                  {banner.desc}
                </p>

                <Link
                  href={banner.id === 5 ? "/seller/register" : "/search"}
                  className="mt-8 group/btn bg-gradient-to-r from-[#f97316] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white text-[14px] font-black py-4 px-10 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-2 inline-flex items-center gap-4 uppercase tracking-wider btn-shine"
                >
                  {banner.btn1}
                  <div className="w-8 h-8 rounded-full bg-white text-[#f97316] flex items-center justify-center group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all">
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
                      sizes="(max-width: 1024px) 0px, 480px"
                      priority={currentSlide === 0}
                      quality={75}
                      className="object-cover transform scale-105 group-hover:scale-110 transition-transform duration-[15s]"
                      alt={banner.imageAlt}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

                    {banner.isLogistics && (
                      <div className="absolute top-[30%] left-[10%] w-64 p-6 bg-yellow-400 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-b-[6px] border-yellow-600 flex flex-col items-center justify-center transform -rotate-12 floating-ui z-30">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-montserrat font-black text-slate-900 text-xl tracking-tighter uppercase">
                            MADS<span className="text-blue-700">JEEZ</span>
                          </span>
                        </div>
                        <div className="w-full h-px bg-slate-900/10 mb-3" />
                        <div className="flex items-center gap-2 text-[12px] font-black text-slate-800 uppercase tracking-widest">
                          <Truck size={16} className="text-blue-600" /> Express Logística
                        </div>
                      </div>
                    )}
                  </div>

                  {banner.isLogistics && (
                    <>
                      <div className="absolute -left-12 bottom-12 glass-panel px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 floating-ui floating-ui-delay-1 z-40">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Navigation size={24} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter">
                            Entrega en Curso
                          </span>
                          <span className="text-white font-black text-sm">ZONA: SPEGAZZINI</span>
                        </div>
                      </div>
                      <div className="absolute -right-6 top-8 glass-panel px-5 py-4 rounded-3xl shadow-2xl flex flex-col items-center gap-1 floating-ui floating-ui-delay-05 z-40">
                        <Clock size={28} className="text-yellow-400 mb-1" />
                        <span className="text-[18px] text-white font-black leading-none">Hoy</span>
                        <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest">En tu puerta</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[50]">
          {heroBanners.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir al banner ${index + 1}`}
              onClick={() => setCurrentSlide(index)}
              className={`touch-target transition-all duration-700 rounded-full ${
                currentSlide === index
                  ? "w-16 h-3 min-h-[12px] bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]"
                  : "w-11 h-3 min-h-[12px] bg-white/30 hover:bg-white/50"
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
            { title: "Envío gratis", icon: Zap, color: "text-yellow-500", desc: "A partir de $30.000 en tu compra" },
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

      {/* MADSJEEZ Ads: espacios patrocinados con campanas reales */}
      <section
        id="publicidad-madsjeez-ads"
        className="max-w-[1184px] mx-auto px-4 mb-12 scroll-mt-24 rounded-2xl border-2 border-[#3483FA]/35 bg-gradient-to-b from-sky-50/95 via-white to-white py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
        aria-label="Espacios publicitarios activos del marketplace"
      >
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.2em] text-[#2968c8]">
          MADSJEEZ Ads
        </p>
        <h2 className="mb-6 text-center text-lg font-black text-slate-900 md:text-xl">
          MADSJEEZ Ads — publicidad activa dentro del marketplace
        </h2>
        <p className="mb-6 max-w-2xl mx-auto text-center text-sm text-slate-600 leading-relaxed">
          Los bloques de abajo muestran campanas activas de vendedores reales dentro del marketplace. La rotacion y la prioridad responden a la inversion de cada campana.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <PaidAdBannerSlot variant="tile" slotKey="home-tile-1" />
          <PaidAdBannerSlot variant="tile" slotKey="home-tile-2" />
          <PaidAdBannerSlot variant="tile" slotKey="home-tile-3" />
        </div>
      </section>

      {/* QUÉ ES MADSJEEZ — resumen para todos los perfiles */}
      <section className="max-w-[1184px] mx-auto px-4 mb-14" aria-labelledby="about-madsjeez-heading">
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-sm overflow-hidden">
          <div className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-white/80">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3483FA] mb-2">
              Marketplace argentino
            </p>
            <h2
              id="about-madsjeez-heading"
              className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4"
            >
              Qué es MADSJEEZ
            </h2>
            <p className="text-slate-600 text-[15px] md:text-base leading-relaxed max-w-3xl">
              Operado desde {COMPANY.address.city} por {COMPANY.founder.name}, {COMPANY.founder.role}.{" "}
              {COMPANY.mission}{" "}
              <Link href="/quienes-somos" className="text-[#3483FA] font-semibold hover:underline">
                Conocé nuestra historia y visión
              </Link>
              .
            </p>
          </div>
          <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {[
              {
                Icon: Store,
                title: "Vendedores y tiendas",
                text:
                  "Publicá productos con fotos y precios, conectá cobros con Mercado Pago, seguí pedidos y reputación desde tu panel.",
                href: "/seller/register",
                cta: "Empezar a vender",
              },
              {
                Icon: Building2,
                title: "Comerciantes",
                text:
                  "Llevá tu catálogo online con una vitrina seria: mismos clientes, menos fricción — pedidos, mensajes y métricas en un solo lugar.",
                href: "/seller/register",
                cta: "Registrar mi negocio",
              },
              {
                Icon: Rocket,
                title: "Emprendedores",
                text:
                  "Probá planes y exposición sin infraestructura propia: desde una cuenta podés vender, promocionar y escalar cuando crezcas.",
                href: "/subscriptions",
                cta: "Ver planes",
              },
              {
                Icon: ShoppingBag,
                title: "Compradores",
                text:
                  "Buscá por categoría o texto, compará, comprá con cuotas cuando aplique y tenés seguimiento de compra y soporte si algo falla.",
                href: "/search",
                cta: "Explorar productos",
              },
              {
                Icon: Users,
                title: "Comunidad y otros usuarios",
                text:
                  "Afiliados, compradores recurrentes o quienes siguen tiendas: podés guardar favoritos, ver ofertas y enterarte de novedades sin perder el hilo.",
                href: "/search",
                cta: "Descubrir",
              },
              {
                Icon: ShieldCheck,
                title: "Confianza para todos",
                text:
                  "Reglas claras, reclamos y canal de ayuda: diseñamos el flujo para que comprar y vender sea predecible y con respaldo.",
                href: "/help",
                cta: "Centro de ayuda",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#3483FA]/30 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3483FA]/10 text-[#3483FA]">
                    <card.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug pt-1">{card.title}</h3>
                </div>
                <p className="text-[13px] md:text-sm text-slate-600 leading-relaxed flex-1 mb-4">{card.text}</p>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#3483FA] hover:text-[#2968c8] mt-auto"
                >
                  {card.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeSocialProof />

      {/* Franja publicitaria principal */}
      <section className="max-w-[1184px] mx-auto px-4 mb-10" aria-labelledby="ads-franja-1">
        <p id="ads-franja-1" className="sr-only">
          Franja publicitaria horizontal de MADSJEEZ Ads
        </p>
        <PaidAdBannerSlot variant="leaderboard" slotKey="home-leaderboard-top" />
      </section>

      {/* MADS PRO BANNER */}
      <section className="max-w-[1184px] mx-auto px-4 mb-10">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.90)_100%)] shadow-[0_22px_55px_rgba(2,6,23,0.28)]">
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-5 border-b border-white/10 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-[#db2777] to-[#ec4899] text-white px-4 py-1.5 rounded-full font-black italic text-lg tracking-tight shadow-lg shadow-pink-500/30 animate-pulse-glow">
                mads+
              </div>
              <span className="font-bold text-[15px] text-white">VIVI MADSJEEZ COMO UN EXPERTO</span>
            </div>
            <Link href="/subscriptions" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-1 btn-shine">
              Suscribirme desde $ 3.490
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {[
              { Icon: Package, color: 'text-fuchsia-300', bg: 'from-fuchsia-500/15 to-pink-500/10', text: 'Envios gratis en productos desde $ 16.000' },
              { Icon: Tv, color: 'text-sky-300', bg: 'from-sky-500/15 to-blue-500/10', text: 'Las mejores plataformas de entretenimiento' },
              { Icon: CreditCard, color: 'text-violet-300', bg: 'from-violet-500/15 to-fuchsia-500/10', text: 'Hasta 3 cuotas extra en tus compras' },
              { Icon: Utensils, color: 'text-orange-300', bg: 'from-orange-500/15 to-amber-500/10', text: 'Envios gratis en pedidos de restaurantes' },
            ].map((item, idx) => (
              <div key={idx} className="group flex flex-col items-center text-center cursor-pointer rounded-[22px] border border-white/8 bg-white/[0.02] px-4 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04]">
                <div className="w-24 h-24 mb-4 relative flex justify-center items-center">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bg} rounded-full scale-100 group-hover:scale-110 transition-transform duration-300`}></div>
                  <item.Icon className={`w-12 h-12 ${item.color} relative z-10`} />
                </div>
                <p className="text-[13px] text-slate-100 font-medium px-4 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. CARRUSEL: Productos rotativos — catálogo completo en rotación automática */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Productos destacados"
          subtitle="Descubrí nuevos productos de nuestro catálogo"
        />
      </section>

      {/* 2. CARRUSEL: Relacionado con tus visitas */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Relacionado con tus visitas"
          subtitle="Rotación automática en todo el catálogo"
          offset={12}
        />
      </section>

      {/* 3. CARRUSEL: Elegidos para vos */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Elegidos para vos"
          subtitle="Nuevas combinaciones cada pocos segundos"
          offset={24}
        />
      </section>

      <section className="max-w-[1184px] mx-auto px-4 mb-8" aria-label="Franja publicitaria entre carruseles">
        <PaidAdBannerSlot variant="leaderboard" slotKey="home-leaderboard-middle" />
      </section>

      {/* 4. CARRUSEL: Herramientas (completa con otras categorías si faltan) */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Herramientas y ferretería"
          subtitle="Prioriza la categoría; si no hay stock, muestra el resto del catálogo"
          offset={36}
          categorySlug="herramientas"
        />
      </section>

      {/* 5. CARRUSEL: Deportes */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Deportes y fitness"
          subtitle="Rotación continua con respaldo de otras categorías"
          offset={48}
          categorySlug="deportes"
        />
      </section>

      {/* 6. CARRUSEL: Más productos rotativos */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="Más productos para vos"
          subtitle="Nuestra selección se renueva automáticamente"
          offset={60}
        />
      </section>

      <section className="max-w-[1184px] mx-auto px-4 mb-10 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.90)_0%,rgba(15,23,42,0.82)_100%)] py-6 shadow-[0_22px_55px_rgba(2,6,23,0.24)] md:py-8">
        <p className="mb-1 text-center text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          MADSJEEZ Ads
        </p>
        <p className="mb-2 text-center text-base font-bold text-white md:text-lg">
          Sponsors y marcas en espacios rectangulares
        </p>
        <p className="mb-5 text-center text-sm text-slate-300">
          Espacios premium para anunciantes, marcas y campanas activas dentro del home del marketplace.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PaidAdBannerSlot variant="rectangle" slotKey="home-rectangle-1" />
          <PaidAdBannerSlot variant="rectangle" slotKey="home-rectangle-2" />
        </div>
      </section>

      {/* 5. CATEGORÍAS (grilla 3×3 + carrusel automático) */}
      <section className="max-w-[1184px] mx-auto px-4">
        <CategoryCarousel />
      </section>

      {/* 7. CARRUSEL: También puede interesarte */}
      <section className="max-w-[1184px] mx-auto px-4">
        <RotatingProductCarousel
          title="También puede interesarte"
          subtitle="Más productos del marketplace en rotación"
          offset={72}
          categorySlug="computacion"
        />
      </section>

      {/* BANNERS PROMOCIONALES */}
      <section className="max-w-[1184px] mx-auto px-4 mb-10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-card rounded shadow-sm flex overflow-hidden cursor-pointer group hover:shadow-md transition-shadow h-[250px] border border-border">
            <div className="w-1/2 p-8 flex flex-col justify-center text-card-foreground">
              <span className="text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2 uppercase">Organizá mejor</span>
              <h3 className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">MÁS ESPACIO Y<br/>ORDEN PRÁCTICO</h3>
              <Link href="/search" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-0.5 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=400" alt="Estantería y muebles para organizar el hogar en Madsjeez" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex-1 bg-card rounded shadow-sm flex overflow-hidden cursor-pointer group hover:shadow-md transition-shadow h-[250px] border border-border">
            <div className="w-1/2 p-8 flex flex-col justify-center text-card-foreground">
              <span className="text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2 uppercase">Renová tu hogar</span>
              <h3 className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">¡HOGAR Y MUEBLES!<br/>HASTA 35% OFF</h3>
              <Link href="/search" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] hover:from-[#ff9100] hover:to-[#ffb703] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-0.5 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <img src="https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=400" alt="Sillón moderno para living — ofertas hogar y muebles Madsjeez" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* PLANES DE VENDEDOR */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-20 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            ¿LISTO PARA <span className="bg-gradient-to-r from-[#f97316] via-[#ffb703] to-[#00b4d8] bg-clip-text text-transparent">ESCALAR?</span>
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
                  : 'bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border border-slate-700 hover:border-[#f97316]/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]'
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
                    : 'bg-gradient-to-br from-[#f97316] to-[#ff9100] shadow-lg shadow-orange-500/30'
                }`}>
                  <plan.icon className={`w-8 h-8 ${plan.featured ? 'text-slate-900' : 'text-white'}`} />
                </div>
                <h3 className={`text-xl font-black mb-2 ${plan.featured ? 'text-[#ffb703]' : plan.name === 'PLATINUM' ? 'text-[#00b4d8]' : 'text-[#f97316]'}`}>{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-300 text-sm">/mes</span>
                </div>
                <div className={`text-xs font-black py-1.5 px-4 rounded-full ${
                  plan.featured
                    ? 'bg-[#ffb703]/20 text-[#ffb703] border border-[#ffb703]/30'
                    : plan.name === 'PLATINUM'
                    ? 'bg-[#00b4d8]/20 text-[#00b4d8] border border-[#00b4d8]/30'
                    : 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/30'
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
                        : 'bg-[#f97316]/20 text-[#f97316]'
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
                    : 'bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 hover:-translate-y-0.5'
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
            { icon: CreditCard, title: "Pagos Certificados", desc: "Blindaje digital de nivel bancario para cada transacción. Crédito instantáneo sin tarjeta.", color: "from-[#f97316] to-[#ff9100]", shadow: "shadow-orange-500/30" },
            { icon: Truck, title: "Logística Inteligente", desc: "Tu pedido siempre localizado. Red de entrega Flash con monitoreo 24/7.", color: "from-[#00b4d8] to-[#0096c7]", shadow: "shadow-cyan-500/30" },
            { icon: ShieldCheck, title: "Compra Protegida", desc: "Garantía total de satisfacción. Si no es lo que esperabas, lo resolvemos en el acto.", color: "from-[#10b981] to-[#059669]", shadow: "shadow-lime-500/30" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group cursor-pointer">
              <div className={`w-20 h-20 rounded-[2.5rem] bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                <item.icon size={36} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter group-hover:text-[#f97316] transition-colors">{item.title}</h4>
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

      <HomeSeoContent />

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] pt-20 pb-10 border-t-[10px] border-[#f97316]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <span className="font-montserrat font-black text-2xl tracking-tighter uppercase text-white">MADS<span className="text-[#f97316]">JEEZ</span></span>
              </div>
              <p className="text-slate-400 font-medium text-sm max-w-sm leading-relaxed mb-6">
                Marketplace del Commerce Group en Argentina: catálogo, ofertas, MADSJEEZ Ads y
                herramientas para vendedores con Mercado Pago, Instagram, Facebook y WhatsApp.
              </p>
              <SiteCompanyFooter />
              <SiteSocialFooter />
            </div>
            {[
              { title: "Marketplace", links: ["Quiénes somos", "Ayuda", "Servicios VIP", "Contacto"] },
              { title: "Ecosistema", links: ["Vender", "Suscripciones", "Impulsar", "API Developers"] },
              { title: "Legales", links: ["Términos", "Privacidad", "Aviso Legal"] }
            ].map((section) => (
              <div key={section.title}>
                <h5 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-6">{section.title}</h5>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link}>
                      <Link
                        href={
                          link === "Quiénes somos"
                            ? "/quienes-somos"
                            : link === "Términos"
                            ? "/legal/terminos"
                            : link === "Privacidad"
                              ? "/legal/privacidad"
                              : link === "Aviso Legal"
                                ? "/legal/aviso-legal"
                                : link === "Vender"
                                  ? "/seller/register"
                                  : link === "Suscripciones"
                                    ? "/subscriptions"
                                    : link === "Impulsar"
                                      ? "/dashboard#publicidad"
                                      : link === "API Developers"
                                        ? "/docs/api"
                                        : link === "Ayuda"
                                        ? "/help"
                                        : link === "Servicios VIP"
                                          ? "/subscriptions"
                                          : link === "Contacto"
                                            ? "/help"
                                            : "/"
                        }
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
              <Link href="/legal/aviso-legal" className="text-[#f97316] hover:text-[#ffb703] transition-colors">DATA FISCAL</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}

