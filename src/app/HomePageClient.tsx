"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { COMPANY } from "@/lib/company"
// SSR habilitado en componentes core para evitar BAILOUT_TO_CLIENT_SIDE_RENDERING
// y que el primer paint llegue ya con contenido (Hero, FoundingSellers, SocialProof, footers).
// Sólo dejamos ssr:false en widgets opcionales que dependen del browser API (auth, ads).
const Navbar = dynamic(() => import("@/components/Navbar"), {
  loading: () => <div className="w-full h-[100px] bg-[linear-gradient(180deg,rgba(15,23,42,0.98)_0%,rgba(15,23,42,0.95)_100%)] sticky top-0 z-[100]" aria-hidden="true" />,
})
const HomeSeoContent = dynamic(() => import("@/components/home/HomeSeoContent").then(m => m.HomeSeoContent), { loading: () => null })
const FoundingSellersSection = dynamic(() => import("@/components/home/FoundingSellersSection").then(m => m.FoundingSellersSection), { loading: () => <div className="max-w-[1184px] mx-auto px-4 mb-20 h-[420px] animate-pulse rounded-3xl bg-muted/60" /> })
const VsMercadoLibreSection = dynamic(() => import("@/components/home/VsMercadoLibreSection").then(m => m.VsMercadoLibreSection), { loading: () => <div className="max-w-[1184px] mx-auto px-4 mb-20 h-[500px] animate-pulse rounded-2xl bg-muted/60" /> })
const HowItWorksSection = dynamic(() => import("@/components/home/HowItWorksSection").then(m => m.HowItWorksSection), { loading: () => <div className="max-w-[1184px] mx-auto px-4 mb-20 h-[500px] animate-pulse rounded-2xl bg-muted/60" /> })
const SellersTestimonialsSection = dynamic(() => import("@/components/home/SellersTestimonialsSection").then(m => m.SellersTestimonialsSection), { loading: () => <div className="max-w-[1184px] mx-auto px-4 mb-20 h-[420px] animate-pulse rounded-2xl bg-muted/60" /> })
const HomeSocialProof = dynamic(() => import("@/components/home/HomeSocialProof").then(m => m.HomeSocialProof), { loading: () => null })
const SiteCompanyFooter = dynamic(() => import("@/components/seo/SiteCompanyFooter").then(m => m.SiteCompanyFooter), { loading: () => null })
const SiteSocialFooter = dynamic(() => import("@/components/seo/SiteSocialFooter").then(m => m.SiteSocialFooter), { loading: () => null })
const SiteNetworkFooter = dynamic(() => import("@/components/seo/SiteNetworkFooter").then(m => m.SiteNetworkFooter), { loading: () => null })
import {
  ShoppingCart,
  ChevronRight,
  Truck,
  Zap,
  ShieldCheck,
  TrendingUp,
  CreditCard,
} from "lucide-react"

const Sparkles = dynamic(() => import("lucide-react").then(m => ({ default: m.Sparkles })))
const Package = dynamic(() => import("lucide-react").then(m => ({ default: m.Package })))
const Box = dynamic(() => import("lucide-react").then(m => ({ default: m.Box })))
const Tv = dynamic(() => import("lucide-react").then(m => ({ default: m.Tv })))
const Utensils = dynamic(() => import("lucide-react").then(m => ({ default: m.Utensils })))
const Store = dynamic(() => import("lucide-react").then(m => ({ default: m.Store })))
const Building2 = dynamic(() => import("lucide-react").then(m => ({ default: m.Building2 })))
const Rocket = dynamic(() => import("lucide-react").then(m => ({ default: m.Rocket })))
const ShoppingBag = dynamic(() => import("lucide-react").then(m => ({ default: m.ShoppingBag })))
const Users = dynamic(() => import("lucide-react").then(m => ({ default: m.Users })))
const Check = dynamic(() => import("lucide-react").then(m => ({ default: m.Check })))
const AIRecommendations = dynamic(() => import("@/components/AIRecommendations"), {
  ssr: false,
  loading: () => null,
})
const CategoryCarousel = dynamic(
  () => import("@/components/CategoryCarousel").then((m) => m.CategoryCarousel),
  { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted/60" /> }
)
const LazyRotatingProductCarousel = dynamic(
  () =>
    import("@/components/LazyRotatingProductCarousel").then((m) => m.LazyRotatingProductCarousel),
  { loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted/60 mb-8" /> }
)
const PaidAdBannerSlot = dynamic(
  () => import("@/components/ads/PaidAdBannerSlot").then((m) => m.PaidAdBannerSlot),
  { loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted/60" /> }
)

// Configuración de banners - 5 banners premium con imagen real y CTA verbo+objeto
const heroBanners = [
  {
    id: 1,
    badge: "Marketplace argentino",
    titleLine1: "Comprá lo que",
    titleLine2: "querés",
    titleHighlight: "hoy mismo",
    desc: "Miles de productos con envío a todo el país y hasta 18 cuotas con Mercado Pago.",
    btn1: "Explorar productos",
    btnHref: "/search",
    Icon: ShoppingCart,
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Paquetes y compras del marketplace Madsjeez Argentina",
    bgGradient: "from-[#0b2f6b] via-slate-900 to-slate-950",
    accent: "blue"
  },
  {
    id: 2,
    badge: "Plan Fundador",
    titleLine1: "Plan PRO",
    titleLine2: "gratis",
    titleHighlight: "6 meses",
    desc: "Solo 100 cupos. Plan PRO sin costo, badge permanente y soporte humano por WhatsApp. Nunca cobramos comisión por venta.",
    btn1: "Postularme",
    btnHref: "/seller/register",
    Icon: TrendingUp,
    image: "https://images.unsplash.com/photo-1556745753-b2904692b3cd?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Vendedora gestionando su tienda online desde una notebook",
    bgGradient: "from-[#1a1a2e] via-slate-900 to-[#0b2f6b]",
    accent: "amber"
  },
  {
    id: 3,
    badge: "Ofertas semanales",
    titleLine1: "Hasta",
    titleLine2: "50% off",
    titleHighlight: "en tecnología",
    desc: "Notebooks, celulares y audio con descuentos reales. Stock limitado, renovación lunes y jueves.",
    btn1: "Ver ofertas",
    btnHref: "/offers",
    Icon: Zap,
    image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Notebook y dispositivos electrónicos en oferta",
    bgGradient: "from-slate-950 via-[#0b2f6b] to-slate-900",
    accent: "blue"
  },
  {
    id: 4,
    badge: "Envío gratis",
    titleLine1: "Recibilo",
    titleLine2: "en tu casa",
    titleHighlight: "en 48 hs",
    desc: "Compras desde $30.000 con envío bonificado a CABA, GBA y principales ciudades.",
    btn1: "Comprar ahora",
    btnHref: "/search",
    Icon: Truck,
    image: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Repartidor entregando paquete en domicilio",
    bgGradient: "from-[#0b2f6b] via-slate-900 to-slate-950",
    accent: "blue"
  },
  {
    id: 5,
    badge: "Cuotas sin interés",
    titleLine1: "Hasta",
    titleLine2: "18 cuotas",
    titleHighlight: "sin interés",
    desc: "Pagá con Mercado Pago, transferencia o tarjeta. Crédito instantáneo en productos seleccionados.",
    btn1: "Ver productos",
    btnHref: "/deals",
    Icon: CreditCard,
    image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=900&q=80",
    imageAlt: "Persona pagando online con tarjeta",
    bgGradient: "from-slate-900 via-[#0b2f6b] to-slate-950",
    accent: "blue"
  }
]

export default function HomePageClient() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [heroAutoplay, setHeroAutoplay] = useState(false)

  const heroSlideCount = heroBanners.length

  useEffect(() => {
    const t = setTimeout(() => setHeroAutoplay(true), 2000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!heroAutoplay || heroSlideCount <= 1) return
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev >= heroSlideCount - 1 ? 0 : prev + 1))
    }, 6000)
    return () => clearInterval(timer)
  }, [heroAutoplay, heroSlideCount])

  return (
    <main className="min-h-screen bg-mesh font-outfit text-slate-900 overflow-x-hidden">
      <Navbar />

      {/* HERO — un solo H1 con "marketplace"; carrusel = fondo + H2 */}
      <section
        className="relative bg-black overflow-hidden h-[min(520px,88vh)] sm:h-[550px] md:h-[700px] flex items-center group pb-16 md:pb-24"
        aria-labelledby="home-marketplace-h1"
      >
        {heroBanners.map((banner, index) => {
          const isActive = currentSlide === index
          const isAdjacent = index === (currentSlide + 1) % heroBanners.length
          if (!isActive && !isAdjacent) return null
          return (
          <div
            key={banner.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
              isActive
                ? "opacity-100 z-10"
                : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!isActive}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${banner.bgGradient}`} />
            {isActive && <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[80px] hidden md:block" />}
          </div>
          )
        })}

        {(() => {
          const banner = heroBanners[currentSlide]
          return (
            <div className="max-w-7xl mx-auto px-4 h-full w-full flex flex-col md:flex-row items-center justify-between gap-12 relative z-20">
              <div className="w-full md:w-3/5 text-left pt-6 md:pt-0">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white font-bold text-[11px] tracking-[0.3em] uppercase mb-4 shadow-lg border border-white/20 bg-white/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />
                  {banner.badge}
                </div>

                <h1
                  id="home-marketplace-h1"
                  className="sr-only"
                >
                  Marketplace en Argentina - MadsJeez
                </h1>

                <h2 className="mt-2 text-4xl md:text-[3.5rem] font-black text-white tracking-tighter leading-[0.92] font-outfit drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]">
                  {banner.titleLine1}{" "}
                  <span className="text-white/55 font-bold">
                    {banner.titleLine2}
                  </span>{" "}
                  <span className="text-yellow-300">
                    {banner.titleHighlight}
                  </span>
                </h2>

                <p className="mt-6 text-base md:text-lg text-white/85 font-medium max-w-lg leading-relaxed">
                  {banner.desc}
                </p>

                <Link
                  href={banner.btnHref || "/search"}
                  prefetch={false}
                  className="touch-target mt-8 group/btn bg-yellow-400 hover:bg-yellow-300 text-slate-900 text-[14px] font-black py-4 px-10 rounded-2xl shadow-xl shadow-yellow-500/25 transition-colors duration-200 inline-flex items-center gap-4 uppercase tracking-wider min-h-[52px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-300"
                >
                  {banner.btn1}
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-yellow-300 flex items-center justify-center transition-transform group-hover/btn:translate-x-1">
                    <ChevronRight size={18} strokeWidth={3} />
                  </div>
                </Link>
              </div>

              <div className="hidden lg:flex relative w-1/2 h-[80%] items-center justify-end">
                <div className="relative w-[480px] h-[520px] p-4 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/20 bg-white/5 transform rotate-2 hover:rotate-0 transition-transform duration-700">
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
                  </div>
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
      <section className="max-w-7xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-50 mb-16">
        <div className="surface-elevated p-1 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100/90">
          {[
            { title: "Medios de pago", icon: CreditCard, color: "text-blue-600", desc: "Hasta 18 cuotas" },
            { title: "Envío gratis", icon: Zap, color: "text-yellow-500", desc: "Desde $30.000" },
            { title: "Best Sellers", icon: TrendingUp, color: "text-emerald-500", desc: "Top del mes" },
            { title: "Protección", icon: ShieldCheck, color: "text-blue-600", desc: "Compra segura" },
          ].map((item, index) => (
            <Link 
              key={index} 
              href="/search"
              prefetch={false}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 p-4 sm:p-6 hover:bg-slate-50/90 transition-all cursor-pointer group min-h-[88px] touch-target"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 group-hover:shadow-md transition-all duration-300 shrink-0">
                <item.icon size={26} className={item.color} strokeWidth={1.5} />
              </div>
              <div className="flex flex-col text-center sm:text-left">
                <span className="font-bold text-[15px] sm:text-[16px] text-slate-800 leading-tight">{item.title}</span>
                <span className="text-[12px] sm:text-[13px] text-slate-500 font-medium mt-0.5 sm:mt-1">{item.desc}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MADSJEEZ Ads: espacios patrocinados con campanas reales */}
      <section
        id="publicidad-madsjeez-ads"
        className="max-w-[1184px] mx-auto px-4 mb-12 scroll-mt-24 rounded-2xl border-2 border-[#3483FA]/35 bg-gradient-to-b from-sky-50/95 via-white to-white py-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:border-[#3483FA]/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900"
        aria-label="Espacios publicitarios activos del marketplace"
      >
        <p className="mb-2 text-center text-xs font-black uppercase tracking-[0.2em] text-[#2968c8] dark:text-[#60a5fa]">
          MADSJEEZ Ads
        </p>
        <h2 className="mb-6 text-center text-lg font-black text-slate-900 md:text-xl dark:text-white">
          MADSJEEZ Ads — publicidad activa dentro del marketplace
        </h2>
        <p className="mb-6 max-w-2xl mx-auto text-center text-sm text-slate-600 leading-relaxed dark:text-slate-300">
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
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white shadow-sm overflow-hidden dark:border-slate-700/70 dark:from-slate-900 dark:to-slate-900">
          <div className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-white/80 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3483FA] mb-2 dark:text-[#60a5fa]">
              Marketplace argentino
            </p>
            <h2
              id="about-madsjeez-heading"
              className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-4 dark:text-white"
            >
              Qué es MADSJEEZ
            </h2>
            <div className="flex flex-col sm:flex-row gap-5 items-start max-w-3xl">
              <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-md dark:border-slate-700">
                <Image
                  src={COMPANY.founder.photoPortrait}
                  alt={`${COMPANY.founder.name}, ${COMPANY.founder.role} de MadsJeez Marketplace`}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
                />
              </div>
              <p className="text-slate-600 text-[15px] md:text-base leading-relaxed dark:text-slate-300">
                Operado desde {COMPANY.address.city} por{" "}
                <strong className="text-slate-800 dark:text-white">{COMPANY.founder.name}</strong>, {COMPANY.founder.role}.{" "}
                {COMPANY.mission}{" "}
                <Link href="/quienes-somos" className="text-[#1a56db] dark:text-[#60a5fa] font-semibold hover:underline">
                  Conocé nuestra historia y visión
                </Link>
                .
              </p>
            </div>
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
                className="flex flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:border-[#3483FA]/30 hover:shadow-md transition-all duration-300 dark:border-slate-700 dark:bg-slate-800/80 dark:hover:border-[#3483FA]/50"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a56db]/10 text-[#1a56db] dark:bg-[#1a56db]/30 dark:text-[#93c5fd]">
                    <card.Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <h3 className="text-[16px] font-bold text-slate-900 leading-snug pt-1 dark:text-white">{card.title}</h3>
                </div>
                <p className="text-[13px] md:text-sm text-slate-600 leading-relaxed flex-1 mb-4 dark:text-slate-300">{card.text}</p>
                <Link
                  href={card.href}
                  prefetch={false}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#1a56db] hover:text-[#1e40af] mt-auto dark:text-[#60a5fa] dark:hover:text-[#93c5fd]"
                >
                  {card.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SELLERS FUNDADORES — programa de 100 cupos + referral */}
      <FoundingSellersSection />

      {/* COMPARATIVA vs MercadoLibre - 7 puntos donde ganamos */}
      <VsMercadoLibreSection />

      {/* CÓMO FUNCIONA en 4 pasos */}
      <HowItWorksSection />

      {/* TESTIMONIOS reales de sellers AR */}
      <SellersTestimonialsSection />

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
              <div className="bg-gradient-to-r from-[#db2777] to-[#ec4899] text-white px-4 py-1.5 rounded-full font-black italic text-lg tracking-tight shadow-lg shadow-pink-500/30 md:animate-pulse-glow">
                mads+
              </div>
              <span className="font-bold text-[15px] text-white">VIVI MADSJEEZ COMO UN EXPERTO</span>
            </div>
            <Link href="/subscriptions" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-500/30 hover:opacity-90 transition-opacity duration-200">
              Suscribirme desde $ 29.999/mes
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            {[
              { Icon: Package, color: 'text-fuchsia-300', bg: 'from-fuchsia-500/15 to-pink-500/10', text: 'Envíos GRATIS en TODOS tus pedidos' },
              { Icon: Tv, color: 'text-sky-300', bg: 'from-sky-500/15 to-blue-500/10', text: 'Las mejores plataformas de entretenimiento' },
              { Icon: CreditCard, color: 'text-violet-300', bg: 'from-violet-500/15 to-fuchsia-500/10', text: 'Hasta 3 cuotas extra en tus compras' },
              { Icon: Utensils, color: 'text-orange-300', bg: 'from-orange-500/15 to-amber-500/10', text: 'Envíos gratis en pedidos de restaurantes' },
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

      {/* CARRUSEL principal — catalogo destacado above the fold */}
      <section className="max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
          eager
          title="Productos destacados"
          subtitle="Descubri nuevos productos de nuestro catalogo"
        />
      </section>

      <section className="max-w-[1184px] mx-auto px-4 mb-8" aria-label="Franja publicitaria entre carruseles">
        <PaidAdBannerSlot variant="leaderboard" slotKey="home-leaderboard-middle" />
      </section>

      {/* CARRUSEL: Herramientas (categoria principal del marketplace) */}
      <section className="cv-auto max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
          title="Herramientas y ferreteria"
          subtitle="Prioriza la categoria; si no hay stock, muestra el resto del catalogo"
          offset={36}
          categorySlug="herramientas"
        />
      </section>

      {/* CARRUSEL: Deportes */}
      <section className="cv-auto max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
          title="Deportes y fitness"
          subtitle="Rotacion continua con respaldo de otras categorias"
          offset={48}
          categorySlug="deportes"
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
      <section className="cv-auto max-w-[1184px] mx-auto px-4">
        <CategoryCarousel />
      </section>

      {/* 7. CARRUSEL: También puede interesarte */}
      <section className="cv-auto max-w-[1184px] mx-auto px-4">
        <LazyRotatingProductCarousel
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
              <p className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">MÁS ESPACIO Y<br/>ORDEN PRÁCTICO</p>
              <Link href="/search" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:opacity-90 transition-opacity duration-200 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <Image src="https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=65&w=400&fm=webp" alt="Estantería y muebles para organizar el hogar en Madsjeez" fill sizes="200px" className="object-cover transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
          <div className="flex-1 bg-card rounded shadow-sm flex overflow-hidden cursor-pointer group hover:shadow-md transition-shadow h-[250px] border border-border">
            <div className="w-1/2 p-8 flex flex-col justify-center text-card-foreground">
              <span className="text-[10px] font-bold tracking-[2px] text-muted-foreground mb-2 uppercase">Renová tu hogar</span>
              <p className="text-[22px] font-bold leading-tight mb-4 text-card-foreground">¡HOGAR Y MUEBLES!<br/>HASTA 35% OFF</p>
              <Link href="/search" className="bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white px-5 py-2 rounded-lg font-bold text-[14px] w-fit shadow-lg shadow-orange-500/30 hover:opacity-90 transition-opacity duration-200 btn-shine">Ver ofertas</Link>
            </div>
            <div className="w-1/2 bg-muted overflow-hidden relative">
              <Image src="https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=65&w=400&fm=webp" alt="Sillón moderno para living — ofertas hogar y muebles Madsjeez" fill sizes="200px" className="object-cover transform group-hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* PLANES DE VENDEDOR */}
      <section className="cv-auto bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-20 px-4">
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
              name: "BÁSICO", price: "0", comm: "50 publicaciones gratis", icon: Box, featured: false,
              benefits: [
                '50 publicaciones activas',
                '0% comisión por venta — siempre',
                'Cobrás con tu Mercado Pago',
                'Chat con compradores',
                'Estadísticas básicas',
                'Soporte por email'
              ]
            },
            {
              name: "PRO", price: "29.999", comm: "200 publicaciones", icon: Zap, featured: true,
              benefits: [
                '200 publicaciones activas',
                '0% comisión por venta — siempre',
                'Envíos GRATIS en TODOS tus pedidos',
                'Meta API completa: Instagram + Facebook + WhatsApp',
                'TikTok Shop integrado + posts automatizados',
                'Soporte prioritario por WhatsApp',
                'Panel de métricas avanzado',
                'Badge PRO en tu perfil'
              ]
            },
            {
              name: "ULTRA", price: "19.999", comm: "Publicaciones ilimitadas", icon: Sparkles, featured: false,
              benefits: [
                'Publicaciones ILIMITADAS',
                '0% comisión por venta — siempre',
                'Exposición máxima (Top Resultados)',
                'Meta API Enterprise + TikTok Ads',
                'Ejecutivo de cuenta dedicado',
                'API completa + White label opcional',
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
                  {plan.comm}
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
                    ? 'bg-gradient-to-r from-[#ffb703] to-[#ffa60a] text-slate-900 shadow-lg shadow-yellow-500/40 hover:opacity-90 hover:-translate-y-0.5'
                    : plan.name === 'PLATINUM'
                    ? 'bg-gradient-to-r from-[#00b4d8] to-[#0096c7] text-slate-900 shadow-lg shadow-cyan-500/30 hover:opacity-90 hover:-translate-y-0.5'
                    : 'bg-gradient-to-r from-[#f97316] to-[#ff9100] text-white shadow-lg shadow-orange-500/30 hover:opacity-90 hover:-translate-y-0.5'
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
              <div className={`w-20 h-20 rounded-[2.5rem] bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-lg ${item.shadow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                <item.icon size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tighter group-hover:text-[#f97316] transition-colors">{item.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Recommendations oculto temporalmente — la IA no va a produccion aun.
          La seccion se restablece quitando los comentarios. */}
      {/* <section className="bg-white py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <AIRecommendations />
        </div>
      </section> */}

      <HomeSeoContent />

      {/* FOOTER */}
      <footer className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] pt-20 pb-10 border-t-[10px] border-[#f97316]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col gap-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <span className="font-outfit font-black text-2xl tracking-tighter uppercase text-white">MADS<span className="text-[#f97316]">JEEZ</span></span>
              </div>
              <p className="text-slate-400 font-medium text-sm max-w-sm leading-relaxed mb-6">
                Marketplace del Commerce Group en Argentina: catálogo, ofertas, MADSJEEZ Ads y
                herramientas para vendedores con Mercado Pago, Instagram, Facebook y WhatsApp.
              </p>
              <SiteCompanyFooter />
              <SiteSocialFooter />
              <SiteNetworkFooter />
            </div>
            {[
              { title: "Marketplace", links: ["Quiénes somos", "Ayuda", "Servicios VIP", "Contacto"] },
              { title: "Ecosistema", links: ["Vender", "Suscripciones", "Impulsar", "API Developers"] },
              { title: "Legales", links: ["Términos", "Privacidad", "Aviso Legal"] }
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-black text-[#f97316] uppercase tracking-widest text-[11px] mb-6">{section.title}</h4>
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

