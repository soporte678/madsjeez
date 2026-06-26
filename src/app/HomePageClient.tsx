"use client"

/**
 * Home de Madsjeez — rediseño orientado a conversión y claridad.
 * Jerarquía: Hero (qué es + 3 acciones) → ¿Qué querés hacer? → Fundadores →
 * Categorías → Productos reales → Vendedores → Compradores → Confianza →
 * MADSJEEZ Ads (abajo) → Planes → Casos de uso → FAQ → SEO → Footer.
 *
 * Reglas: sin métricas/testimonios inventados; afirmaciones honestas; el "0%
 * comisión por venta" es el modelo real (monetiza por suscripción). Ads y
 * publicidad van abajo, no arriba. Mobile-first.
 */

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { Reveal } from "@/components/seller/premium/motion-primitives"
import {
  Search, ShoppingBag, Store, Globe, ChevronRight, Check, ShieldCheck,
  MapPin, MessageCircle, FileText, CreditCard, Wrench, Hammer, Home as HomeIcon,
  Baby, Boxes, Tv, Tag, Megaphone, Building2,
} from "lucide-react"

const Navbar = dynamic(() => import("@/components/Navbar"), {
  loading: () => <div className="h-[88px] w-full bg-slate-950" aria-hidden />,
})
const FoundingSellersSection = dynamic(() => import("@/components/home/FoundingSellersSection").then(m => m.FoundingSellersSection), { loading: () => <div className="mx-auto mb-16 h-[380px] max-w-[1184px] animate-pulse rounded-3xl bg-muted/60" /> })
const CategoryCarousel = dynamic(() => import("@/components/CategoryCarousel").then(m => m.CategoryCarousel), { loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted/60" /> })
const LazyRotatingProductCarousel = dynamic(() => import("@/components/LazyRotatingProductCarousel").then(m => m.LazyRotatingProductCarousel), { loading: () => <div className="mb-8 h-48 animate-pulse rounded-xl bg-muted/60" /> })
const PaidAdBannerSlot = dynamic(() => import("@/components/ads/PaidAdBannerSlot").then(m => m.PaidAdBannerSlot), { loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted/60" /> })
const HomeSeoContent = dynamic(() => import("@/components/home/HomeSeoContent").then(m => m.HomeSeoContent), { loading: () => null })
const AppQRCode = dynamic(() => import("@/components/home/AppQRCode").then(m => m.AppQRCode), { ssr: false, loading: () => <div className="w-14 h-14 rounded-lg bg-gray-800 animate-pulse flex-shrink-0" /> })
const SiteCompanyFooter = dynamic(() => import("@/components/seo/SiteCompanyFooter").then(m => m.SiteCompanyFooter), { loading: () => null })
const SiteSocialFooter = dynamic(() => import("@/components/seo/SiteSocialFooter").then(m => m.SiteSocialFooter), { loading: () => null })
const SiteNetworkFooter = dynamic(() => import("@/components/seo/SiteNetworkFooter").then(m => m.SiteNetworkFooter), { loading: () => null })

const track = (name: string, params?: Record<string, unknown>) => trackEvent(name, params ?? {})

const CATEGORIES = [
  { name: "Repuestos", Icon: Boxes, href: "/search?q=repuestos" },
  { name: "Herramientas", Icon: Wrench, href: "/search?q=herramientas" },
  { name: "Ferretería", Icon: Hammer, href: "/search?q=ferreteria" },
  { name: "Hogar", Icon: HomeIcon, href: "/search?q=hogar" },
  { name: "Bebé e indumentaria", Icon: Baby, href: "/search?q=bebe" },
  { name: "Mayoristas", Icon: Building2, href: "/search?q=mayorista" },
  { name: "Tecnología", Icon: Tv, href: "/search?q=tecnologia" },
  { name: "Ofertas", Icon: Tag, href: "/offers" },
]

const FAQS = [
  { q: "¿Qué es Madsjeez?", a: "Madsjeez es un marketplace argentino donde compradores encuentran productos y vendedores publican su catálogo, crean su tienda y suman un nuevo canal de venta online." },
  { q: "¿Puedo comprar productos?", a: "Sí. Explorás el catálogo por categoría o búsqueda, consultás al vendedor, pagás con los medios disponibles según la publicación y seguís tu compra desde tu cuenta." },
  { q: "¿Puedo vender mis productos?", a: "Sí. Te registrás como vendedor, publicás tus productos con fotos, precio y stock, y recibís consultas o ventas desde un solo lugar." },
  { q: "¿Puedo crear mi tienda?", a: "Sí. Podés armar tu propia tienda dentro de Madsjeez con nombre y link para compartir por WhatsApp, Instagram o Facebook." },
  { q: "¿Madsjeez cobra comisión por venta?", a: "No cobramos comisión por venta: el vendedor recibe el importe en su cuenta de Mercado Pago. La plataforma se monetiza con planes de suscripción opcionales." },
  { q: "¿Cómo empiezo?", a: "Si querés comprar, explorá el catálogo. Si querés vender, registrate como vendedor o creá tu tienda. En minutos podés publicar tu primer producto." },
]

const faqJsonLd = {
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
}
const itemListJsonLd = {
  "@context": "https://schema.org", "@type": "ItemList",
  itemListElement: CATEGORIES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `https://www.madsjeez.com.ar${c.href}` })),
}

export default function HomePageClient() {
  const router = useRouter()
  const [q, setQ] = useState("")

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    track("search_submit", { source: "home_hero", term: term || undefined })
    router.push(term ? `/search?q=${encodeURIComponent(term)}` : "/search")
  }

  return (
    <main className="min-h-screen bg-background font-outfit text-foreground overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <Navbar />

      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_60%_at_18%_0%,rgba(249,115,22,0.18),transparent),radial-gradient(50%_60%_at_100%_30%,rgba(29,78,216,0.20),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Marketplace argentino
            </span>
            <h1 className="mt-5 text-4xl font-black leading-[1.04] tracking-tight md:text-6xl">
              Comprá y vendé online en <span className="text-[#f97316]">Madsjeez</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75 md:text-lg">
              El marketplace argentino donde compradores encuentran productos y vendedores crean su tienda,
              publican su catálogo y suman un nuevo canal de venta.
            </p>

            {/* Buscador central */}
            <form onSubmit={onSearch} className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-white/15 bg-white/95 p-1.5 shadow-2xl shadow-black/30">
              <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscá productos, marcas o tiendas…"
                aria-label="Buscar en el marketplace"
                className="w-full bg-transparent px-1 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              <button type="submit" className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90">Buscar</button>
            </form>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/search" onClick={() => track("home_explore_products_click")} className="inline-flex items-center gap-2 rounded-xl bg-[#f97316] px-6 py-3 text-sm font-black text-white transition hover:bg-[#ea670c]">
                Explorar productos <ChevronRight className="h-4 w-4" />
              </Link>
              <Link href="/seller/register" onClick={() => track("home_start_selling_click")} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Empezar a vender
              </Link>
            </div>
          </div>

          {/* Visual: tarjetas mock (no claims) */}
          <div className="relative hidden md:block">
            <div className="ml-auto w-[88%] rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-500"><Search className="h-3.5 w-3.5" /> Buscar en Madsjeez</div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="h-16 rounded-lg bg-gradient-to-br from-white/10 to-white/[0.03]" />
                    <div className="mt-2 h-2.5 w-3/4 rounded bg-white/15" />
                    <div className="mt-1.5 h-2.5 w-1/2 rounded bg-[#f97316]/60" />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Store className="h-7 w-7 rounded-lg bg-[#f97316]/20 p-1.5 text-[#f97316]" />
                <div><div className="h-2.5 w-24 rounded bg-white/20" /><div className="mt-1 h-2 w-16 rounded bg-white/10" /></div>
                <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white/70">Tienda</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── ¿QUÉ QUERÉS HACER? ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">¿Qué querés hacer?</h2>
        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { Icon: ShoppingBag, title: "Comprar productos", desc: "Encontrá productos, ofertas y tiendas dentro del marketplace.", cta: "Ver catálogo", href: "/search", ev: "home_explore_products_click" },
            { Icon: Store, title: "Vender en Madsjeez", desc: "Publicá tus productos, recibí consultas y sumá un nuevo canal de venta.", cta: "Quiero vender", href: "/seller/register", ev: "home_start_selling_click" },
            { Icon: Globe, title: "Crear mi tienda", desc: "Armá tu vidriera online con nombre propio y link para compartir.", cta: "Crear tienda", href: "/crear-tienda-online", ev: "home_create_store_click" },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.07} className="h-full">
              <Link href={c.href} onClick={() => track(c.ev)} className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-lg">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><c.Icon className="h-6 w-6" /></span>
                <h3 className="mt-4 text-lg font-bold text-foreground">{c.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-6 text-muted-foreground">{c.desc}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">{c.cta} <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── SELLERS FUNDADORES ───────── */}
      <FoundingSellersSection />

      {/* ───────── CATEGORÍAS PRINCIPALES ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Categorías destacadas</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Reveal key={c.name} delay={i * 0.04}>
              <Link href={c.href} onClick={() => track("category_click", { category: c.name })} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.Icon className="h-5 w-5" /></span>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary">{c.name}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────── PRODUCTOS DESTACADOS (reales) ───────── */}
      <section className="mx-auto max-w-[1184px] px-4">
        <LazyRotatingProductCarousel eager title="Productos destacados" subtitle="Productos reales del catálogo del marketplace" />
      </section>
      <section className="cv-auto mx-auto max-w-[1184px] px-4">
        <LazyRotatingProductCarousel title="Herramientas y ferretería" offset={36} categorySlug="herramientas" />
      </section>

      {/* ───────── PARA VENDEDORES ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Tu negocio también puede vender en Madsjeez</h2>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "Publicá productos con fotos, precio y stock.",
                "Creá tu tienda dentro del marketplace.",
                "Compartí tu link por WhatsApp, Instagram y Facebook.",
                "Recibí consultas o ventas desde un solo lugar.",
                "Usá herramientas de carga rápida para no publicar uno por uno.",
                "Sumá visibilidad sin depender de una sola plataforma.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}</li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/seller/register" onClick={() => track("home_start_selling_click")} className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">Empezar a vender</Link>
              <Link href="/crear-tienda-online" onClick={() => track("home_create_store_click")} className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-bold text-foreground hover:bg-muted">Crear mi tienda</Link>
            </div>
          </div>
          {/* PARA COMPRADORES */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Comprá con más información y atención directa</h2>
            <ul className="mt-6 space-y-3 text-sm text-foreground">
              {[
                "Explorá productos por categoría.",
                "Consultá al vendedor antes de comprar.",
                "Pagá con los medios disponibles según la publicación.",
                "Seguí tus compras desde tu cuenta.",
                "Guardá favoritos y descubrí tiendas y ofertas.",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {b}</li>
              ))}
            </ul>
            <Link href="/search" onClick={() => track("home_explore_products_click")} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-foreground px-6 py-3 text-sm font-bold text-background hover:opacity-90">Explorar productos</Link>
          </div>
        </Reveal>
      </section>

      {/* ───────── CONFIANZA (honesto) ───────── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Un marketplace con datos claros</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Madsjeez es un marketplace argentino en crecimiento, operado desde Buenos Aires, con datos de contacto
            visibles, políticas claras y herramientas pensadas para que comprar y vender sea más simple.
          </p>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: MapPin, title: "Operación en Argentina", desc: "Empresa operada desde Buenos Aires, con dirección y CUIT visibles." },
              { Icon: MessageCircle, title: "Soporte y contacto", desc: "Canal de ayuda y contacto directo para compradores y vendedores." },
              { Icon: FileText, title: "Políticas claras", desc: "Términos, privacidad y reglas de compra accesibles desde el sitio." },
              { Icon: CreditCard, title: "Medios de pago", desc: "Pagos con los medios disponibles según cada publicación." },
            ].map((t) => (
              <div key={t.title} className="rounded-2xl border border-border bg-background p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><t.Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 font-semibold text-foreground">{t.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/quienes-somos" className="font-semibold text-primary hover:underline">Quiénes somos</Link>
            <Link href="/ayuda" className="font-semibold text-primary hover:underline">Centro de ayuda</Link>
            <Link href="/legal/terminos" className="font-semibold text-primary hover:underline">Términos</Link>
            <Link href="/legal/privacidad" className="font-semibold text-primary hover:underline">Privacidad</Link>
          </div>
        </div>
      </section>

      {/* ───────── MADSJEEZ ADS (movido abajo, como herramienta de vendedores) ───────── */}
      <section id="publicidad-madsjeez-ads" className="mx-auto max-w-[1184px] scroll-mt-24 px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Para vendedores</p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-bold text-foreground md:text-2xl"><Megaphone className="h-5 w-5 text-primary" /> Impulsá tus productos dentro del marketplace</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Los vendedores pueden destacar productos, campañas y tiendas dentro de espacios publicitarios internos de Madsjeez.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PaidAdBannerSlot variant="tile" slotKey="home-tile-1" />
            <PaidAdBannerSlot variant="tile" slotKey="home-tile-2" />
            <PaidAdBannerSlot variant="tile" slotKey="home-tile-3" />
          </div>
          <Link href="/dashboard#publicidad" className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">Conocer MADSJEEZ Ads <ChevronRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* ───────── PLANES (orden y precios coherentes) ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Planes para vendedores</h2>
          <p className="mt-3 text-sm text-muted-foreground">Empezá gratis y subí de plan cuando tu volumen lo justifique. Nunca cobramos comisión por venta.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[
            { name: "Básico", price: "$0", tagline: "Para empezar", feats: ["50 publicaciones activas", "0% comisión por venta", "Cobrás con tu Mercado Pago", "Chat con compradores", "Estadísticas básicas"], featured: false },
            { name: "Pro", price: "$2.999", tagline: "6 meses gratis para nuevos", feats: ["200 publicaciones activas", "0% comisión por venta", "Badge Pro en tu perfil", "Soporte prioritario", "Panel de métricas avanzado", "Herramientas de difusión"], featured: true },
            { name: "Ultra", price: "$4.999", tagline: "Para escalar", feats: ["Publicaciones ilimitadas", "0% comisión por venta", "Máxima exposición en búsquedas", "Soporte dedicado", "Todo lo de Pro"], featured: false },
          ].map((p) => (
            <div key={p.name} className={`relative flex flex-col rounded-2xl border bg-card p-6 ${p.featured ? "border-primary shadow-lg" : "border-border"}`}>
              {p.featured && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[11px] font-black uppercase tracking-wide text-primary-foreground">{p.tagline}</span>}
              <p className="text-sm font-bold text-muted-foreground">{p.name}</p>
              <p className="mt-1 text-3xl font-black text-foreground">{p.price}<span className="text-sm font-medium text-muted-foreground">/mes</span></p>
              {!p.featured && <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>}
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-foreground">
                {p.feats.map((f) => <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {f}</li>)}
              </ul>
              <Link href="/subscriptions" className={`mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold ${p.featured ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:bg-muted"}`}>Ver plan</Link>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Los precios y beneficios completos están en <Link href="/subscriptions" className="font-semibold text-primary hover:underline">Suscripciones</Link>.</p>
      </section>

      {/* ───────── CASOS DE USO (en vez de testimonios inventados) ───────── */}
      <section className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Para qué lo usan los vendedores</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ejemplos de uso típicos en el marketplace.</p>
          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: Hammer, t: "Ferretería que carga su catálogo", d: "Lleva su stock al online y suma un canal además del mostrador." },
              { Icon: ShoppingBag, t: "Emprendedor que vende por Instagram", d: "Ordena su catálogo en una vidriera con link para compartir." },
              { Icon: Building2, t: "Mayorista que recibe consultas", d: "Muestra su oferta por cantidad y conecta con revendedores." },
              { Icon: Boxes, t: "Repuestero que muestra compatibilidades", d: "Publica piezas para que los compradores encuentren la correcta." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-background p-5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><c.Icon className="h-5 w-5" /></span>
                <h3 className="mt-3 text-sm font-bold text-foreground">{c.t}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CATEGORÍAS (carrusel real) ───────── */}
      <section className="cv-auto mx-auto max-w-[1184px] px-4 py-6">
        <CategoryCarousel />
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Preguntas frecuentes</h2>
        <div className="mt-6 divide-y divide-border rounded-2xl border border-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-foreground">
                {f.q}<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────── APP TRUST STRIP ───────── */}
      <section className="bg-gray-950 border-t border-gray-800/70">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* texto */}
            <div className="flex items-center gap-3 sm:flex-1">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#f97316] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">Madsjeez también está disponible como app</p>
                <p className="text-gray-500 text-xs mt-0.5">Android · iPhone · Misma cuenta · Sin costo extra</p>
              </div>
            </div>

            {/* QR + badges + link */}
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-end">
              {/* QR */}
              <a href="/descargar-app" title="Escaneá para instalar la app" className="flex-shrink-0 hover:opacity-80 transition-opacity">
                <AppQRCode size={56} />
              </a>

              {/* Google Play — Próximamente */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2 opacity-50 select-none cursor-default">
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3.8C3 3 3.9 2.5 4.6 2.9L21 11.5C21.7 11.9 21.7 12.9 21 13.3L4.6 21.9C3.9 22.3 3 21.8 3 21V3.8Z" fill="url(#gp1)"/>
                    <path d="M3 3.8L13 12.4 4.6 2.9C3.9 2.5 3 3 3 3.8Z" fill="url(#gp2)"/>
                    <path d="M3 21L13 12.4 4.6 21.9C3.9 22.3 3 21.8 3 21Z" fill="#1a9e47"/>
                    <path d="M21 11.5L13 12.4 21 13.3C21.7 12.9 21.7 11.9 21 11.5Z" fill="#f9ab00"/>
                    <defs>
                      <linearGradient id="gp1" x1="3" y1="12.4" x2="21" y2="12.4" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#4285f4"/>
                        <stop offset="100%" stopColor="#34a853"/>
                      </linearGradient>
                      <linearGradient id="gp2" x1="3" y1="8" x2="13" y2="8" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ea4335"/>
                        <stop offset="100%" stopColor="#4285f4"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="text-left">
                    <div className="text-gray-500 text-[9px] leading-tight">Pronto en</div>
                    <div className="text-gray-300 text-xs font-bold leading-tight">Google Play</div>
                  </div>
                </div>
                <span className="absolute -top-2 -right-1.5 bg-[#f97316] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">Próx.</span>
              </div>

              {/* App Store — Próximamente */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/60 rounded-xl px-3 py-2 opacity-50 select-none cursor-default">
                  <svg className="w-6 h-6 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <div className="text-gray-500 text-[9px] leading-tight">Pronto en</div>
                    <div className="text-gray-300 text-xs font-bold leading-tight">App Store</div>
                  </div>
                </div>
                <span className="absolute -top-2 -right-1.5 bg-[#f97316] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap">Próx.</span>
              </div>

              {/* link */}
              <a href="/descargar-app"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-[#f97316] hover:text-orange-400 font-semibold text-sm transition-colors group">
                Ver cómo instalarla
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── SEO ───────── */}
      <HomeSeoContent />

      {/* ───────── FOOTER ───────── */}
      <footer className="border-t-[10px] border-[#f97316] bg-gradient-to-b from-[#1a1a2e] to-[#16213e] pb-10 pt-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-6">
            <div className="col-span-2">
              <span className="font-outfit text-2xl font-black uppercase tracking-tighter text-white">MADS<span className="text-[#f97316]">JEEZ</span></span>
              <p className="mt-5 mb-6 max-w-sm text-sm leading-relaxed font-medium text-slate-400">
                Marketplace argentino para comprar y vender online: catálogo, ofertas, MADSJEEZ Ads y herramientas
                para vendedores con Mercado Pago, Instagram, Facebook y WhatsApp.
              </p>
              <SiteCompanyFooter />
              <SiteSocialFooter />
              <SiteNetworkFooter />
            </div>
            {[
              { title: "Marketplace", links: [["Quiénes somos", "/quienes-somos"], ["Centro de ayuda", "/ayuda"], ["Ofertas", "/offers"], ["Contacto", "/ayuda"]] },
              { title: "Vendedores", links: [["Empezar a vender", "/seller/register"], ["Crear mi tienda", "/crear-tienda-online"], ["Ayuda para vendedores", "/ayuda-vendedores"], ["Suscripciones", "/subscriptions"]] },
              { title: "Guías y ayuda", links: [["Guías de compra", "/guias"], ["Reparación", "/reparacion"], ["Comparativas", "/comparativas"], ["Marcas", "/marcas"], ["Blog", "/blog"], ["Tutoriales", "/tutoriales"]] },
              { title: "Legales", links: [["Términos", "/legal/terminos"], ["Privacidad", "/legal/privacidad"], ["Aviso Legal", "/legal/aviso-legal"]] },
            ].map((section) => (
              <div key={section.title}>
                <h4 className="mb-5 text-[11px] font-black uppercase tracking-widest text-[#f97316]">{section.title}</h4>
                <ul className="flex flex-col gap-3">
                  {section.links.map(([label, href]) => (
                    <li key={label}><Link href={href} className="text-[13px] font-bold text-slate-400 transition-colors hover:text-[#00b4d8]">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-700 pt-10 text-[11px] font-black tracking-widest text-slate-500 md:flex-row">
            <span className="text-slate-400">COPYRIGHT © 2026 MADSJEEZ COMMERCE GROUP S.R.L.</span>
            <Link href="/legal/aviso-legal" className="text-[#f97316] transition-colors hover:text-[#ffb703]">DATA FISCAL</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
