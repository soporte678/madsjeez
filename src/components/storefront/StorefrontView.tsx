"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage";
import { Reveal } from "@/components/premium";
import type { PublicStoreData, StoreBranding } from "@/lib/public-store";
import {
  Package, Search, MessageCircle, MapPin, AtSign, Users, Globe,
  ChevronRight, Mail, ExternalLink, ChevronDown, Ruler, Phone,
  AlertCircle, Truck, CreditCard, Shirt, Star,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${full}`;
}
function mapsEmbedUrl(address: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16`;
}
function mapsLink(address: string) {
  return `https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// ─── Color extraction ────────────────────────────────────────────────────────

const COLOR_MAP: Array<{ pattern: RegExp; hex: string; name: string; border?: string }> = [
  { pattern: /\bhierro\b/i,     hex: "#94a3b8", name: "Hierro" },
  { pattern: /\bblanco\b/i,     hex: "#f1f5f9", name: "Blanco", border: "#cbd5e1" },
  { pattern: /\bnegro\b/i,      hex: "#1e293b", name: "Negro" },
  { pattern: /\bfucsia\b/i,     hex: "#e91e8c", name: "Fucsia" },
  { pattern: /verde musgo/i,    hex: "#4a7c59", name: "Verde Musgo" },
  { pattern: /\bpistacho\b/i,   hex: "#86efac", name: "Pistacho" },
  { pattern: /\bmerlot\b/i,     hex: "#7f1d3f", name: "Merlot" },
  { pattern: /\blavanda\b/i,    hex: "#a78bfa", name: "Lavanda" },
  { pattern: /\brojo\b/i,       hex: "#ef4444", name: "Rojo" },
  { pattern: /\bacacia\b/i,     hex: "#c4a462", name: "Acacia" },
  { pattern: /vichy/i,          hex: "#475569", name: "Vichy" },
  { pattern: /estampa Francia/i,hex: "#6366f1", name: "Estampado" },
  { pattern: /estampa/i,        hex: "#8b5cf6", name: "Estampado" },
  { pattern: /argentina/i,      hex: "#3b82f6", name: "Argentina" },
];

function extractColor(text: string) {
  for (const c of COLOR_MAP) {
    if (c.pattern.test(text)) return c;
  }
  return null;
}

function extractCategory(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("top")) return "Tops";
  if (t.includes("malla enteriza") || t.includes("vedetina") || t.includes("cala")) return "Mallas";
  if (t.includes("triángulo") || t.includes("triangulito") || t.includes("colaless") || t.includes("culotte") || t.includes("bottom") || t.includes("bottom")) return "Bikinis";
  if (t.includes("pollerita") || t.includes("remera")) return "Cover-ups";
  return "Colección";
}

// ─── TikTok icon ─────────────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.23 8.23 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-1.01-.12z"/>
    </svg>
  );
}

// ─── Size guide data ──────────────────────────────────────────────────────────

const SIZE_GUIDE = [
  { talle: "S",   arg: "38", busto: "82–86", cintura: "64–68", cadera: "88–92" },
  { talle: "M",   arg: "40", busto: "88–92", cintura: "70–74", cadera: "94–98" },
  { talle: "L",   arg: "42", busto: "94–98", cintura: "76–80", cadera: "100–104" },
  { talle: "XL",  arg: "44", busto: "100–104", cintura: "82–86", cadera: "106–110" },
  { talle: "XXL", arg: "46", busto: "106–110", cintura: "88–92", cadera: "112–116" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SizeGuide({ primary }: { primary: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <Ruler className="h-5 w-5 text-slate-400" />
          <span className="font-semibold text-slate-800">Guía de talles</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">S — XXL</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <p className="mt-4 mb-3 text-xs text-slate-500">Medidas en cm. Tomadas sobre el cuerpo sin ropa.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Talle</th>
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Arg.</th>
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Busto</th>
                  <th className="py-2 pr-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Cintura</th>
                  <th className="py-2 text-left text-xs font-bold uppercase tracking-wider text-slate-400">Cadera</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((row, i) => (
                  <tr key={row.talle} className={i % 2 === 0 ? "bg-slate-50/50" : ""}>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded-lg font-bold text-white text-sm" style={{ background: primary }}>
                        {row.talle}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500 font-medium">{row.arg}</td>
                    <td className="py-2.5 pr-4 text-slate-700">{row.busto} cm</td>
                    <td className="py-2.5 pr-4 text-slate-700">{row.cintura} cm</td>
                    <td className="py-2.5 text-slate-700">{row.cadera} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800">
            <strong>¿Dudas con el talle?</strong> Consultanos por WhatsApp — te ayudamos a elegir el indicado para vos.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────

function ProductCard({
  p, primary, waHref, onProductClick,
}: {
  p: { id: string; title: string; price: number; image: string | null; images: string[]; categoryName: string; description: string | null; isAnticipo: boolean };
  primary: string;
  waHref: string;
  onProductClick: (id: string) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const color = extractColor(`${p.title} ${p.description ?? ""}`);
  const cat = extractCategory(p.title);
  const images = p.images.length > 0 ? p.images : p.image ? [p.image] : [];
  const hasMultiple = images.length > 1;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-300"
      onMouseEnter={() => hasMultiple && setImgIndex(1)}
      onMouseLeave={() => setImgIndex(0)}
    >
      {/* Badges */}
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {p.isAnticipo && (
          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow">
            Anticipo
          </span>
        )}
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500 backdrop-blur">
          {cat}
        </span>
      </div>

      {/* Fotos counter badge */}
      {hasMultiple && (
        <div className="absolute right-2 top-2 z-10">
          <span className="flex items-center gap-0.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-white" />
            {images.length} fotos
          </span>
        </div>
      )}

      {/* Image carousel */}
      <Link href={`/product/${p.id}`} onClick={() => onProductClick(p.id)} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-50">
          {images.length > 0 ? (
            <>
              {images.map((src, i) => (
                <OptimizedProductImage
                  key={src}
                  src={src}
                  title={p.title}
                  category={p.categoryName}
                  fill
                  sizes="(max-width:768px) 50vw, 25vw"
                  className={`object-contain p-3 transition-all duration-500 ${
                    i === imgIndex ? "opacity-100 scale-100" : "opacity-0 scale-[1.02] absolute inset-0"
                  }`}
                  priority={i === 0}
                />
              ))}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-10 w-10 text-slate-300" />
            </div>
          )}

          {/* Dots navegador (desktop hover) */}
          {hasMultiple && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {images.map((_, i) => (
                <button
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                  }`}
                  onMouseEnter={(e) => { e.stopPropagation(); setImgIndex(i); }}
                  onClick={(e) => e.preventDefault()}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="rounded-full bg-white px-5 py-2 text-xs font-bold text-slate-900 shadow">
              Ver detalles →
            </span>
          </div>
        </div>
      </Link>

      {/* Thumbnail strip (si hay múltiples fotos) */}
      {hasMultiple && (
        <div className="flex gap-1.5 border-t border-slate-100 px-3 py-2">
          {images.slice(0, 5).map((src, i) => (
            <button
              key={src}
              onMouseEnter={() => setImgIndex(i)}
              onClick={(e) => { e.preventDefault(); setImgIndex(i); }}
              className={`relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150 ${
                i === imgIndex ? "border-pink-400 opacity-100" : "border-transparent opacity-60 hover:opacity-90"
              }`}
              aria-label={`Foto ${i + 1}`}
            >
              <OptimizedProductImage
                src={src}
                title={p.title}
                fill
                sizes="36px"
                className="object-contain p-0.5"
              />
            </button>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 pt-1">
        {/* Color chip */}
        {color && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-full border"
              style={{ background: color.hex, borderColor: color.border ?? color.hex }}
            />
            <span className="text-[11px] font-medium text-slate-400">{color.name}</span>
          </div>
        )}

        <Link href={`/product/${p.id}`} onClick={() => onProductClick(p.id)}>
          <h2 className="line-clamp-2 text-xs font-medium leading-snug text-slate-700 hover:text-slate-900">
            {p.title}
          </h2>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-sm font-black" style={{ color: primary }}>
            ${p.price.toLocaleString("es-AR")}
          </p>
          {p.isAnticipo ? (
            <span className="text-[10px] font-semibold text-amber-600">Consultar</span>
          ) : (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-white transition hover:opacity-90"
              style={{ background: "#16a34a" }}
              onClick={(e) => e.stopPropagation()}
            >
              <MessageCircle className="h-2.5 w-2.5" /> Stock
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StorefrontView({ store, branding }: { store: PublicStoreData; branding: StoreBranding | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState("Todo");

  const primary = branding?.primaryColor || "#e91e8c";
  const secondary = branding?.secondaryColor || "#f472b6";
  const name = branding?.name || store.displayName;
  const logo = branding?.logoUrl || store.image;
  const logoUnoptimized = !!(logo?.startsWith("/api/"));
  const desc = branding?.description || store.description;
  const shortDesc = branding?.shortDescription;
  const location = [branding?.city, branding?.province].filter(Boolean).join(", ");
  const address = branding?.address;
  const waPhone = branding?.whatsapp || branding?.phone;
  const waHref = waPhone ? waLink(waPhone) : "#";

  type Social = { Icon: React.FC<{ className?: string }>; href: string; label: string; color?: string };
  const socials: Social[] = [
    branding?.instagram && {
      Icon: AtSign,
      href: branding.instagram.startsWith("http") ? branding.instagram : `https://instagram.com/${branding.instagram}`,
      label: `Instagram @${branding.instagram.replace(/^https?:\/\/[^/]+\//, "")}`,
      color: "#e1306c",
    },
    branding?.tiktok && {
      Icon: TikTokIcon,
      href: branding.tiktok.startsWith("http") ? branding.tiktok : `https://tiktok.com/@${branding.tiktok}`,
      label: `TikTok @${branding.tiktok}`,
      color: "#000",
    },
    branding?.facebook && {
      Icon: Users,
      href: branding.facebook.startsWith("http") ? branding.facebook : `https://facebook.com/${branding.facebook}`,
      label: "Facebook",
      color: "#1877f2",
    },
    branding?.website && { Icon: Globe, href: branding.website, label: "Sitio web" },
  ].filter(Boolean) as Social[];

  // Tabs dinámicos según productos reales
  const allTabs = ["Todo", "Tops", "Mallas", "Bikinis", "Cover-ups", "Anticipo"];
  const availableTabs = ["Todo", ...allTabs.slice(1).filter((tab) => {
    if (tab === "Anticipo") return store.products.some((p) => p.isAnticipo);
    return store.products.some((p) => extractCategory(p.title) === tab);
  })];

  const filteredProducts = store.products.filter((p) => {
    if (activeTab === "Todo") return true;
    if (activeTab === "Anticipo") return p.isAnticipo;
    return extractCategory(p.title) === activeTab;
  });

  const trackStore = (type: string, productId?: string) => {
    try {
      const payload = JSON.stringify({ slug: store.storeSlug, type, productId });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/stores/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/stores/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
      }
    } catch { /* no-op */ }
  };
  useEffect(() => { trackStore("view"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(`/search?seller=${store.id}${term ? `&q=${encodeURIComponent(term)}` : ""}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 font-outfit text-slate-900">

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
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
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hidden items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white sm:inline-flex"
              style={{ background: "#16a34a" }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Consultar por WhatsApp
            </a>
          )}

          <form onSubmit={onSearch} className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 sm:ml-2 sm:flex">
            <Search className="h-4 w-4 text-slate-400" />
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

      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-14 md:py-20"
        style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 60%, #fce7f3 100%)` }}
      >
        {/* Pattern overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
        />

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
            {/* Logo grande */}
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white/40 bg-white shadow-2xl md:h-32 md:w-32">
              {logo ? (
                <Image src={logo} alt={name} fill sizes="128px" className="object-contain p-2" unoptimized={logoUnoptimized} />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-4xl font-black" style={{ color: primary }}>
                  {name.charAt(0)}
                </span>
              )}
            </div>

            <div className="text-white">
              <h1 className="text-3xl font-black drop-shadow md:text-5xl">{name}</h1>
              {shortDesc && <p className="mt-2 max-w-xl text-white/90 md:text-lg">{shortDesc}</p>}

              {/* Feature pills */}
              <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                {[
                  { Icon: Truck, text: "Envío gratis +$150k" },
                  { Icon: CreditCard, text: "Cuotas s/interés" },
                  { Icon: Shirt, text: "Talles S al XXL" },
                  { Icon: Star, text: "Materiales premium" },
                ].map(({ Icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <Icon className="h-3 w-3" /> {text}
                  </span>
                ))}
              </div>

              {/* CTA buttons */}
              {waPhone && (
                <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black shadow-lg transition hover:scale-105"
                    style={{ color: primary }}
                  >
                    <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
                  </a>
                  <a
                    href="#productos"
                    className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/50 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    Ver productos <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl bg-white/15 p-4 backdrop-blur-sm md:grid-cols-3">
            {[
              { value: store.productCount.toString(), label: "Productos" },
              { value: "5", label: "Talles disponibles" },
              { value: location || "CABA", label: "Ubicación" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center text-white">
                <p className="text-xl font-black drop-shadow">{value}</p>
                <p className="text-xs text-white/80">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stock notice ──────────────────────────────────────────────── */}
      <div className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Stock limitado.</strong> Consultá disponibilidad de talle y color por WhatsApp antes de hacer tu pedido.
            {waPhone && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold underline underline-offset-2 hover:no-underline">
                Consultar ahora →
              </a>
            )}
          </p>
        </div>
      </div>

      {/* ── Products section ──────────────────────────────────────────── */}
      <section id="productos" className="mx-auto max-w-6xl px-4 py-10">
        {/* Tabs */}
        {availableTabs.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeTab === tab
                    ? "text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
                }`}
                style={activeTab === tab ? { background: tab === "Anticipo" ? "#f59e0b" : primary } : {}}
              >
                {tab}
                {tab !== "Todo" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({tab === "Anticipo"
                      ? store.products.filter((p) => p.isAnticipo).length
                      : store.products.filter((p) => extractCategory(p.title) === tab).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p, i) => (
              <Reveal key={p.id} delay={Math.min(i, 7) * 0.04} className="h-full">
                <ProductCard
                  p={p}
                  primary={primary}
                  waHref={waHref}
                  onProductClick={(id) => {
                    trackEvent("store_product_click", { product_id: id, store: store.storeSlug });
                    trackStore("product_click", id);
                  }}
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-16 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="mt-4 font-semibold text-slate-500">No hay productos en esta categoría</p>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href={`/search?seller=${store.id}`}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-90 hover:shadow-lg"
            style={{ background: primary }}
          >
            Ver catálogo completo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Size guide + about ────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Size guide */}
            <SizeGuide primary={primary} />

            {/* Sobre la marca */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="h-1 w-8 rounded-full" style={{ background: primary }} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sobre la marca</p>
              </div>
              {desc ? (
                <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
              ) : (
                <p className="text-sm leading-relaxed text-slate-600">
                  Kachet es una marca argentina de bikinis, mallas y ropa de playa. Diseños exclusivos con materiales de alta calidad, pensados para cada tipo de cuerpo.
                </p>
              )}

              {/* Beneficios */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { Icon: Truck, title: "Envío gratis", desc: "En compras +$150.000" },
                  { Icon: CreditCard, title: "Cuotas s/int.", desc: "Hasta 12 cuotas" },
                  { Icon: Ruler, title: "S al XXL", desc: "Talles inclusivos" },
                  { Icon: MessageCircle, title: "Asesoramiento", desc: "Por WhatsApp" },
                ].map(({ Icon, title, desc: d }) => (
                  <div key={title} className="rounded-xl bg-slate-50 p-3">
                    <Icon className="mb-1.5 h-4 w-4 text-slate-400" />
                    <p className="text-xs font-bold text-slate-700">{title}</p>
                    <p className="text-[11px] text-slate-400">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Encontranos ───────────────────────────────────────────────── */}
      {(address || waPhone || branding?.email || socials.length > 0) && (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full" style={{ background: primary }} />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Encontranos</p>
            </div>

            <div className={`grid gap-6 ${address ? "lg:grid-cols-2" : ""}`}>
              {/* Contacto */}
              <div className="flex flex-col gap-3">
                {address && (
                  <a href={mapsLink(address)} target="_blank" rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Dirección</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{address}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
                        Ver en Google Maps <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </a>
                )}

                {waPhone && (
                  <a href={waHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-green-300 hover:shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">WhatsApp</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{branding?.phone || waPhone}</p>
                    </div>
                  </a>
                )}

                {branding?.email && (
                  <a href={`mailto:${branding.email}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Email</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{branding.email}</p>
                    </div>
                  </a>
                )}

                {/* Redes */}
                {socials.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-bold text-slate-500">Seguinos en redes</p>
                    <div className="flex flex-col gap-2.5">
                      {socials.map((s) => (
                        <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                            style={{ background: s.color ? `${s.color}18` : "#f1f5f9" }}>
                            <s.Icon className="h-4 w-4" style={{ color: s.color }} />
                          </span>
                          {s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Maps embed */}
              {address && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <iframe
                    title={`Ubicación de ${name}`}
                    src={mapsEmbedUrl(address)}
                    width="100%"
                    height="360"
                    style={{ border: 0, display: "block" }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1.5 px-4 text-center">
          <Link href="/crear-tienda-online" className="text-sm font-semibold text-slate-400 hover:text-slate-700">
            Tienda creada con <span className="font-black text-slate-700">Madsjeez</span>
          </Link>
          <p className="text-xs text-slate-300">© {name} · Todos los derechos reservados</p>
        </div>
      </footer>

      {/* ── Floating WhatsApp ─────────────────────────────────────────── */}
      {waPhone && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Consultar por WhatsApp"
          onClick={() => { trackEvent("store_whatsapp_click", { store: store.storeSlug }); trackStore("whatsapp_click"); }}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110 hover:bg-green-600 hover:shadow-2xl"
          style={{ animation: "waPulse 2.5s ease-in-out infinite" }}
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      )}

      <style>{`
        @keyframes waPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
        }
      `}</style>
    </main>
  );
}

export default StorefrontView;
