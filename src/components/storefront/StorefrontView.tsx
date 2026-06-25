"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { trackEvent } from "@/lib/analytics"
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage"
import { Reveal } from "@/components/premium"
import type { PublicStoreData, StoreBranding } from "@/lib/public-store"
import {
  Package, Search, MessageCircle, MapPin, AtSign, Users, Globe,
  ChevronRight, Mail, ExternalLink, Ruler,
  Truck, CreditCard, Shirt, Star, ShieldCheck,
} from "lucide-react"

// ─── TikTok icon ─────────────────────────────────────────────────────────────
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.23 8.23 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-1.01-.12z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function waLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, "")
  const full = digits.startsWith("54") ? digits : `54${digits}`
  const base = `https://wa.me/${full}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
function mapsEmbedUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16`
}
function mapsLink(address: string) {
  return `https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

// ─── Color extraction ─────────────────────────────────────────────────────────
const COLOR_MAP: Array<{ pattern: RegExp; hex: string; name: string; border?: string }> = [
  { pattern: /\bhierro\b/i,      hex: "#94a3b8", name: "Hierro" },
  { pattern: /\bblanco\b/i,      hex: "#f8fafc", name: "Blanco", border: "#cbd5e1" },
  { pattern: /\bnegro\b/i,       hex: "#1e293b", name: "Negro" },
  { pattern: /\bfucsia\b/i,      hex: "#e91e8c", name: "Fucsia" },
  { pattern: /verde musgo/i,     hex: "#4a7c59", name: "Verde Musgo" },
  { pattern: /\bpistacho\b/i,    hex: "#86efac", name: "Pistacho" },
  { pattern: /\bmerlot\b/i,      hex: "#7f1d3f", name: "Merlot" },
  { pattern: /\blavanda\b/i,     hex: "#a78bfa", name: "Lavanda" },
  { pattern: /\brojo\b/i,        hex: "#ef4444", name: "Rojo" },
  { pattern: /\bacacia\b/i,      hex: "#c4a462", name: "Acacia" },
  { pattern: /vichy/i,           hex: "#475569", name: "Vichy" },
  { pattern: /estampa Francia/i, hex: "#6366f1", name: "Estampado" },
  { pattern: /estampa/i,         hex: "#8b5cf6", name: "Estampado" },
  { pattern: /argentina/i,       hex: "#3b82f6", name: "Argentina" },
]

function extractColor(text: string) {
  for (const c of COLOR_MAP) {
    if (c.pattern.test(text)) return c
  }
  return null
}

function extractCategory(title: string): string {
  const t = title.toLowerCase()
  if (t.includes("top")) return "Tops"
  if (t.includes("malla enteriza") || t.includes("vedetina") || t.includes("cala")) return "Mallas"
  if (t.includes("triángulo") || t.includes("triangulito") || t.includes("colaless") || t.includes("culotte") || t.includes("bottom")) return "Bikinis"
  if (t.includes("pollerita") || t.includes("remera")) return "Cover-ups"
  return "Colección"
}

// ─── Size guide data ──────────────────────────────────────────────────────────
const SIZE_GUIDE = [
  { talle: "S",   arg: "38", busto: "82-86",   cintura: "64-68",  cadera: "88-92"   },
  { talle: "M",   arg: "40", busto: "88-92",   cintura: "70-74",  cadera: "94-98"   },
  { talle: "L",   arg: "42", busto: "94-98",   cintura: "76-80",  cadera: "100-104" },
  { talle: "XL",  arg: "44", busto: "100-104", cintura: "82-86",  cadera: "106-110" },
  { talle: "XXL", arg: "46", busto: "106-110", cintura: "88-92",  cadera: "112-116" },
]

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({
  p, primary, waPhone, storeName, onProductClick,
}: {
  p: { id: string; title: string; price: number; image: string | null; images: string[]; categoryName: string; description: string | null; isAnticipo: boolean }
  primary: string
  waPhone: string | null
  storeName: string
  onProductClick: (id: string) => void
}) {
  const [imgIndex, setImgIndex] = useState(0)
  const productMsg = `¡Hola! Te escribo desde la tienda de ${storeName} en Madsjeez. Me interesa el producto: "${p.title}". ¿Me podés dar más información sobre talles, colores y disponibilidad?`
  const productWaHref = waPhone ? waLink(waPhone, productMsg) : null
  const color = extractColor(`${p.title} ${p.description ?? ""}`)
  const cat = extractCategory(p.title)
  const images = p.images.length > 0 ? p.images : p.image ? [p.image] : []
  const hasMultiple = images.length > 1

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      onMouseEnter={() => hasMultiple && setImgIndex(1)}
      onMouseLeave={() => setImgIndex(0)}
    >
      {/* Badges */}
      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
        {p.isAnticipo && (
          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow-sm">
            Anticipo
          </span>
        )}
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
          {cat}
        </span>
      </div>

      {/* Foto count */}
      {hasMultiple && (
        <div className="absolute right-2.5 top-2.5 z-10">
          <span className="flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            {images.length}
          </span>
        </div>
      )}

      {/* Image carousel */}
      <Link href={`/product/${p.id}`} onClick={() => onProductClick(p.id)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
          {images.length > 0 ? (
            images.map((src, i) => (
              <OptimizedProductImage
                key={src}
                src={src}
                title={p.title}
                category={p.categoryName}
                fill
                sizes="(max-width:768px) 50vw, 25vw"
                className={`object-contain p-2 transition-all duration-500 ${
                  i === imgIndex ? "opacity-100 scale-100" : "opacity-0 scale-[1.02] absolute inset-0"
                }`}
                priority={i === 0}
              />
            ))
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-slate-200" />
            </div>
          )}

          {/* Dot navigator */}
          {hasMultiple && (
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === imgIndex ? "w-5 bg-white shadow" : "w-1.5 bg-white/50"
                  }`}
                  onMouseEnter={(e) => { e.stopPropagation(); setImgIndex(i) }}
                  onClick={(e) => e.preventDefault()}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="rounded-full bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow-lg">
              Ver detalles
            </span>
          </div>
        </div>
      </Link>

      {/* Thumbnail strip */}
      {hasMultiple && (
        <div className="flex gap-1.5 px-3 pt-2 pb-1">
          {images.slice(0, 5).map((src, i) => (
            <button
              key={src}
              onMouseEnter={() => setImgIndex(i)}
              onClick={(e) => { e.preventDefault(); setImgIndex(i) }}
              className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150"
              style={{
                borderColor: i === imgIndex ? primary : "transparent",
                opacity: i === imgIndex ? 1 : 0.5,
              }}
              aria-label={`Foto ${i + 1}`}
            >
              <OptimizedProductImage src={src} title={p.title} fill sizes="32px" className="object-contain p-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-1">
        {color && (
          <div className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full border"
              style={{ background: color.hex, borderColor: color.border ?? color.hex }}
            />
            <span className="text-[11px] font-medium text-slate-400">{color.name}</span>
          </div>
        )}

        <Link href={`/product/${p.id}`} onClick={() => onProductClick(p.id)}>
          <h2 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-700 hover:text-slate-900">
            {p.title}
          </h2>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-sm font-black" style={{ color: primary }}>
            ${p.price.toLocaleString("es-AR")}
          </p>
          {productWaHref && (
            <a
              href={productWaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:opacity-90 active:scale-95"
              style={{ background: p.isAnticipo ? "#f59e0b" : "#16a34a" }}
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-2.5 w-2.5" />
              {p.isAnticipo ? "Anticipo" : "Consultar"}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StorefrontView({ store, branding }: { store: PublicStoreData; branding: StoreBranding | null }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [activeTab, setActiveTab] = useState("Todo")

  const primary   = branding?.primaryColor   || "#e91e8c"
  const secondary = branding?.secondaryColor || "#f472b6"
  const name      = branding?.name           || store.displayName
  const logo      = branding?.logoUrl        || store.image
  const logoUnoptimized = !!(logo?.startsWith("/api/"))
  const desc      = branding?.description    || store.description
  const shortDesc = branding?.shortDescription
  const location  = [branding?.city, branding?.province].filter(Boolean).join(", ")
  const address   = branding?.address
  const waPhone   = branding?.whatsapp       || branding?.phone

  const waHrefGeneral = waPhone
    ? waLink(waPhone, `¡Hola ${name}! Te escribo desde tu tienda en Madsjeez. Quisiera más información sobre sus productos.`)
    : "#"
  const waHrefStock = waPhone
    ? waLink(waPhone, `¡Hola ${name}! Te escribo desde tu tienda en Madsjeez. Antes de hacer mi pedido, quería consultar disponibilidad de talle y color. ¿Me podés ayudar?`)
    : "#"

  type Social = { Icon: React.FC<{ className?: string }>; href: string; label: string; color?: string }
  const socials: Social[] = [
    branding?.instagram && {
      Icon: AtSign,
      href: branding.instagram.startsWith("http")
        ? branding.instagram
        : `https://instagram.com/${branding.instagram}`,
      label: `@${branding.instagram.replace(/^https?:\/\/[^/]+\//, "").replace(/^@/, "")}`,
      color: "#e1306c",
    },
    branding?.tiktok && {
      Icon: TikTokIcon,
      href: branding.tiktok.startsWith("http")
        ? branding.tiktok
        : `https://tiktok.com/@${branding.tiktok}`,
      label: `@${branding.tiktok.replace(/^@/, "")}`,
      color: "#000",
    },
    branding?.facebook && {
      Icon: Users,
      href: branding.facebook.startsWith("http")
        ? branding.facebook
        : `https://facebook.com/${branding.facebook}`,
      label: "Facebook",
      color: "#1877f2",
    },
    branding?.website && { Icon: Globe, href: branding.website, label: "Sitio web" },
  ].filter(Boolean) as Social[]

  const allTabs = ["Todo", "Tops", "Mallas", "Bikinis", "Cover-ups", "Anticipo"]
  const availableTabs = ["Todo", ...allTabs.slice(1).filter((tab) => {
    if (tab === "Anticipo") return store.products.some((p) => p.isAnticipo)
    return store.products.some((p) => extractCategory(p.title) === tab)
  })]

  const filteredProducts = store.products.filter((p) => {
    if (activeTab === "Todo") return true
    if (activeTab === "Anticipo") return p.isAnticipo
    return extractCategory(p.title) === activeTab
  })

  const trackStore = (type: string, productId?: string) => {
    try {
      const payload = JSON.stringify({ slug: store.storeSlug, type, productId })
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/stores/track", new Blob([payload], { type: "application/json" }))
      } else {
        fetch("/api/stores/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {})
      }
    } catch { /* no-op */ }
  }
  useEffect(() => { trackStore("view") /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [])

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    router.push(`/search?seller=${store.id}${term ? `&q=${encodeURIComponent(term)}` : ""}`)
  }

  return (
    <main className="min-h-screen bg-white font-outfit text-slate-900">

      {/* ── Sticky header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {logo ? (
              <Image src={logo} alt={name} fill sizes="36px" className="object-contain p-1" unoptimized={logoUnoptimized} />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-black" style={{ color: primary }}>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="truncate font-bold text-slate-900">{name}</span>

          {waPhone && (
            <a
              href={waHrefGeneral}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hidden items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white transition hover:opacity-90 sm:inline-flex"
              style={{ background: "#16a34a" }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Consultar
            </a>
          )}

          <form
            onSubmit={onSearch}
            className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-slate-300 focus-within:bg-white sm:ml-2 sm:flex"
          >
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar en la tienda"
              aria-label="Buscar"
              className="w-36 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </form>
        </div>
      </header>

      {/* ── HERO — dark editorial ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#080808]">
        {/* Grain texture overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Pink radial glow top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[600px] w-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, ${primary}35, transparent 65%)` }}
        />
        {/* Secondary glow bottom-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full"
          style={{ background: `radial-gradient(circle, ${secondary}18, transparent 65%)` }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

            {/* LEFT: brand + CTAs */}
            <div>
              {/* "Tienda verificada" badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: primary }}
                />
                <span className="text-xs font-medium text-white/50">Tienda verificada en Madsjeez</span>
              </div>

              {/* Brand name */}
              <h1 className="text-6xl font-black leading-[0.92] tracking-tight text-white md:text-7xl lg:text-8xl">
                {name}
              </h1>
              <div className="mt-4 h-[3px] w-16 rounded-full" style={{ background: primary }} />

              {shortDesc && (
                <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
                  {shortDesc}
                </p>
              )}

              {/* Feature pills */}
              <div className="mt-8 flex flex-wrap gap-2">
                {[
                  { Icon: Truck,      text: "Envío gratis +$150k" },
                  { Icon: CreditCard, text: "Cuotas sin interés"  },
                  { Icon: Shirt,      text: "Talles S al XXL"     },
                  { Icon: Star,       text: "Materiales premium"  },
                ].map(({ Icon, text }) => (
                  <span
                    key={text}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-sm"
                  >
                    <Icon className="h-3 w-3 shrink-0" style={{ color: primary }} />
                    {text}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              {waPhone && (
                <div className="mt-9 flex flex-wrap gap-3">
                  <a
                    href={waHrefGeneral}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: primary,
                      boxShadow: `0 8px 32px ${primary}55`,
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Consultar por WhatsApp
                  </a>
                  <a
                    href="#productos"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    Ver productos <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            {/* RIGHT: logo display + stats */}
            <div className="flex flex-col items-center gap-8">
              {/* Big logo with pink glow */}
              <div
                className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-[36px]"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: `0 0 0 1px ${primary}30, 0 24px 80px ${primary}28, inset 0 1px 0 rgba(255,255,255,0.06)`,
                }}
              >
                {logo ? (
                  <Image
                    src={logo}
                    alt={name}
                    fill
                    sizes="208px"
                    className="object-contain p-6"
                    unoptimized={logoUnoptimized}
                  />
                ) : (
                  <span className="text-8xl font-black" style={{ color: primary }}>
                    {name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="grid w-full grid-cols-3 gap-3">
                {[
                  { value: store.productCount.toString(), label: "Productos" },
                  { value: "5",                           label: "Talles"    },
                  { value: location || "CABA",            label: "Ubicación" },
                ].map(({ value, label }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-4 text-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p className="text-xl font-black text-white">{value}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee strip ────────────────────────────────────────────────────── */}
      <div
        className="overflow-hidden border-y py-3"
        style={{ borderColor: `${primary}20`, background: `${primary}06` }}
      >
        <div className="ks-marquee flex whitespace-nowrap">
          {[0, 1].map((set) => (
            <div key={set} className="flex shrink-0 items-center">
              {[
                "Bikinis exclusivas",
                "Tops premium",
                "Mallas enterizas",
                "Cover-ups",
                "Envío gratis",
                "Cuotas sin interés",
                "Materiales de calidad",
                "Talles S al XXL",
                "Diseño argentino",
                "100% Kachet",
              ].map((item, i) => (
                <span key={`${set}-${i}`} className="flex items-center">
                  <span className="px-5 text-sm font-semibold text-slate-600">{item}</span>
                  <span className="text-sm font-black" style={{ color: primary }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stock notice ─────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: primary }} />
          <p className="text-sm text-slate-600">
            Stock limitado por talle y color. Consultá disponibilidad antes de hacer tu pedido.
            {waPhone && (
              <a
                href={waHrefStock}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 font-bold underline underline-offset-2 hover:no-underline"
                style={{ color: primary }}
              >
                Consultar por WhatsApp
              </a>
            )}
          </p>
        </div>
      </div>

      {/* ── Products ─────────────────────────────────────────────────────────── */}
      <section id="productos" className="mx-auto max-w-6xl px-4 py-12">
        {/* Section header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Colección</h2>
            <p className="mt-1 text-sm text-slate-500">{store.productCount} artículos disponibles</p>
          </div>

          {availableTabs.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {availableTabs.map((tab) => {
                const count =
                  tab === "Todo"    ? null
                  : tab === "Anticipo" ? store.products.filter((p) => p.isAnticipo).length
                  : store.products.filter((p) => extractCategory(p.title) === tab).length
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                      activeTab === tab
                        ? "text-white shadow-sm"
                        : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
                    }`}
                    style={activeTab === tab ? { background: tab === "Anticipo" ? "#f59e0b" : primary } : {}}
                  >
                    {tab}
                    {count != null && (
                      <span className="ml-1.5 text-xs opacity-70">({count})</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 7) * 0.04} className="h-full">
                <ProductCard
                  p={p}
                  primary={primary}
                  waPhone={waPhone ?? null}
                  storeName={name}
                  onProductClick={(id) => {
                    trackEvent("store_product_click", { product_id: id, store: store.storeSlug })
                    trackStore("product_click", id)
                  }}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <Package className="h-12 w-12 text-slate-200" />
            <p className="mt-4 font-semibold text-slate-500">No hay productos en esta categoría</p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href={`/search?seller=${store.id}`}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg hover:opacity-90"
            style={{ background: primary }}
          >
            Ver catálogo completo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Guía de Talles ───────────────────────────────────────────────────── */}
      <section id="talles" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          {/* Header */}
          <div className="mb-10 flex items-center gap-4">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ background: `${primary}18` }}
            >
              <Ruler className="h-5 w-5" style={{ color: primary }} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900">Guía de Talles</h2>
              <p className="mt-0.5 text-sm text-slate-500">Medidas en cm, tomadas sobre el cuerpo sin ropa</p>
            </div>
          </div>

          {/* Size cards grid */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {SIZE_GUIDE.map((size) => (
              <div
                key={size.talle}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-opacity-50 hover:shadow-md"
              >
                {/* Talle chip */}
                <div className="mb-4 text-center">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-sm"
                    style={{ background: primary }}
                  >
                    {size.talle}
                  </span>
                  <p className="mt-2 text-[11px] font-medium text-slate-400">Talle Arg. {size.arg}</p>
                </div>

                {/* Measurements */}
                <div className="space-y-2.5 border-t border-slate-100 pt-3.5">
                  {[
                    { label: "Busto",   value: size.busto   },
                    { label: "Cintura", value: size.cintura },
                    { label: "Cadera",  value: size.cadera  },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {label}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{value} cm</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* How to measure */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <h3 className="mb-6 text-base font-black text-slate-900">Cómo tomarte las medidas</h3>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  letter: "B",
                  label: "Busto",
                  tip: "Pasá la cinta métrica alrededor del pecho a la altura de los senos. Mantené la cinta horizontal y sin apretar.",
                },
                {
                  letter: "C",
                  label: "Cintura",
                  tip: "Medí en la parte más estrecha del torso, generalmente unos centímetros por encima del ombligo.",
                },
                {
                  letter: "H",
                  label: "Cadera",
                  tip: "Pasá la cinta por la parte más ancha de caderas y glúteos, mantené los pies juntos.",
                },
              ].map(({ letter, label, tip }) => (
                <div key={label} className="flex gap-4">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                    style={{ background: primary }}
                  >
                    {letter}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{tip}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* WA CTA */}
            {waPhone && (
              <a
                href={waHrefStock}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 flex items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 px-5 py-4 transition hover:bg-green-100"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                  <p className="text-sm font-semibold text-green-800">
                    ¿Dudas con tu talle? Consultanos y te ayudamos a elegir el indicado.
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-green-500" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── Sobre la marca (dark editorial) ──────────────────────────────────── */}
      <section className="bg-[#080808]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left: editorial text */}
            <div>
              <h2 className="text-4xl font-black leading-tight text-white md:text-5xl">
                Diseño argentino<br />
                <span style={{ color: primary }}>con identidad.</span>
              </h2>
              <div className="mt-4 h-[2px] w-12 rounded-full" style={{ background: `${primary}60` }} />
              <p className="mt-6 text-base leading-relaxed text-white/50">
                {desc ||
                  "Kachet es una marca argentina de bikinis, mallas y ropa de playa. Diseños exclusivos con materiales de alta calidad, pensados para cada tipo de cuerpo."}
              </p>
              {waPhone && (
                <a
                  href={waHrefGeneral}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl border px-6 py-3 text-sm font-bold transition hover:bg-white/5"
                  style={{ borderColor: `${primary}45`, color: primary }}
                >
                  <MessageCircle className="h-4 w-4" /> Consultarnos
                </a>
              )}
            </div>

            {/* Right: benefit cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { Icon: Truck,       title: "Envío gratis",       desc: "En compras +$150.000", accent: "#16a34a" },
                { Icon: CreditCard,  title: "Cuotas sin interés", desc: "Hasta 12 cuotas",      accent: "#3b82f6" },
                { Icon: Shirt,       title: "Talles S al XXL",    desc: "Inclusivos y exactos", accent: primary   },
                { Icon: ShieldCheck, title: "Compra protegida",   desc: "Garantía Madsjeez",    accent: "#8b5cf6" },
              ].map(({ Icon, title, desc: d, accent }) => (
                <div
                  key={title}
                  className="rounded-2xl p-5 transition"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${accent}25` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: accent }} />
                  </div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-white/40">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Encontranos ──────────────────────────────────────────────────────── */}
      {(address || waPhone || branding?.email || socials.length > 0) && (
        <section id="contacto" className="border-t border-slate-100 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="mb-10">
              <h2 className="text-3xl font-black text-slate-900">Encontranos</h2>
              {location && <p className="mt-1 text-sm text-slate-500">{location}</p>}
            </div>

            <div className={`grid gap-8 ${address ? "lg:grid-cols-[400px_1fr]" : ""}`}>
              {/* Contact panel */}
              <div className="flex flex-col gap-3">
                {/* WhatsApp — most prominent */}
                {waPhone && (
                  <a
                    href={waHrefGeneral}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-2xl p-5 transition hover:opacity-95"
                    style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)" }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-green-100">WhatsApp</p>
                        <p className="mt-0.5 text-lg font-black text-white">{branding?.phone || waPhone}</p>
                        <p className="text-xs text-green-200">Consultas, pedidos y asesoramiento</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/50 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </a>
                )}

                {/* Address */}
                {address && (
                  <a
                    href={mapsLink(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                      <MapPin className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-500">Dirección</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{address}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 group-hover:text-red-500">
                        Ver en Google Maps <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </a>
                )}

                {/* Email */}
                {branding?.email && (
                  <a
                    href={`mailto:${branding.email}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Email</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-800">{branding.email}</p>
                    </div>
                  </a>
                )}

                {/* Social links */}
                {socials.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Redes sociales</p>
                    <div className="flex flex-col gap-2">
                      {socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                        >
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                            style={{ background: s.color ? `${s.color}18` : "#f1f5f9" }}
                          >
                            <s.Icon className="h-4 w-4" style={{ color: s.color }} />
                          </span>
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                            {s.label}
                          </span>
                          <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Map — immersive full-height */}
              {address ? (
                <div
                  className="overflow-hidden rounded-2xl border border-slate-200 shadow-lg"
                  style={{ minHeight: 500 }}
                >
                  <iframe
                    title={`Ubicación de ${name}`}
                    src={mapsEmbedUrl(address)}
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: "block", minHeight: 500 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 p-12 text-center"
                  style={{ background: `linear-gradient(135deg, ${primary}08, transparent)` }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: `${primary}15` }}
                  >
                    <Globe className="h-8 w-8" style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">Vendemos a todo el país</p>
                    <p className="mt-1 text-sm text-slate-500">Envíos por correo y encomienda a toda Argentina</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="bg-[#080808] py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-3">
              {logo && (
                <div className="relative h-8 w-8 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={logo}
                    alt={name}
                    fill
                    sizes="32px"
                    className="object-contain p-0.5"
                    unoptimized={logoUnoptimized}
                  />
                </div>
              )}
              <span className="text-sm font-black text-white/70">{name}</span>
            </div>

            {/* Branded divider */}
            <div
              className="h-px w-full max-w-xs"
              style={{ background: `linear-gradient(90deg, transparent, ${primary}60, transparent)` }}
            />

            <Link
              href="/crear-tienda-online"
              className="text-sm text-white/30 transition hover:text-white/60"
            >
              Tienda creada con{" "}
              <span className="font-black text-white/50">Madsjeez</span>
            </Link>
            <p className="text-xs text-white/20">
              &copy; {name} - Todos los derechos reservados
            </p>
          </div>
        </div>
      </footer>

      {/* ── Floating WhatsApp ─────────────────────────────────────────────────── */}
      {waPhone && (
        <a
          href={waHrefGeneral}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Consultar por WhatsApp"
          onClick={() => {
            trackEvent("store_whatsapp_click", { store: store.storeSlug })
            trackStore("whatsapp_click")
          }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition-all hover:scale-110"
          style={{
            background: "#16a34a",
            animation: "waPulse 2.5s ease-in-out infinite",
          }}
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}

      <style>{`
        @keyframes waPulse {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(22,163,74,0.45), 0 0 0 0 rgba(22,163,74,0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(22,163,74,0.45), 0 0 0 14px rgba(22,163,74,0);
          }
        }
        .ks-marquee {
          animation: ksMarquee 32s linear infinite;
        }
        @keyframes ksMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ks-marquee { animation: none; }
        }
      `}</style>
    </main>
  )
}

export default StorefrontView
