"use client";

/**
 * Storefront público temable (Fase 3). Renderiza la tienda con la marca del
 * vendedor (logo, banner, color), botón WhatsApp y productos reales.
 * Server fetch en la page; este componente agrega interactividad + analytics.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage";
import { Reveal } from "@/components/premium";
import type { PublicStoreData, StoreBranding } from "@/lib/public-store";
import {
  Store, Package, Search, MessageCircle, MapPin, AtSign, Users, Globe,
  ChevronRight, Phone, Mail, ExternalLink,
} from "lucide-react";

function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("54") ? digits : `54${digits}`;
  return `https://wa.me/${full}`;
}

function mapsEmbedUrl(address: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=16`;
}

function mapsLink(address: string): string {
  return `https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.23 8.23 0 0 0 4.78 1.52v-3.4a4.85 4.85 0 0 1-1.01-.12z"/>
    </svg>
  );
}

export function StorefrontView({ store, branding }: { store: PublicStoreData; branding: StoreBranding | null }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const primary = branding?.primaryColor || "#1d4ed8";
  const secondary = branding?.secondaryColor || "#3b82f6";
  const name = branding?.name || store.displayName;
  const logo = branding?.logoUrl || store.image;
  const logoUnoptimized = !!(logo?.startsWith("/api/"));
  const banner = branding?.bannerUrl;
  const bannerUnoptimized = !!(banner?.startsWith("/api/"));
  const desc = branding?.description || store.description;
  const shortDesc = branding?.shortDescription;
  const location = [branding?.city, branding?.province].filter(Boolean).join(", ");
  const address = branding?.address;
  const phone = branding?.phone || branding?.whatsapp;

  // Redes sociales con TikTok
  type Social = { Icon: React.FC<{ className?: string }>; href: string; label: string; color?: string };
  const socials: Social[] = [
    branding?.instagram && {
      Icon: AtSign,
      href: branding.instagram.startsWith("http") ? branding.instagram : `https://instagram.com/${branding.instagram}`,
      label: "Instagram",
      color: "#e1306c",
    },
    branding?.tiktok && {
      Icon: TikTokIcon,
      href: branding.tiktok.startsWith("http") ? branding.tiktok : `https://tiktok.com/@${branding.tiktok}`,
      label: "TikTok",
      color: "#000000",
    },
    branding?.facebook && {
      Icon: Users,
      href: branding.facebook.startsWith("http") ? branding.facebook : `https://facebook.com/${branding.facebook}`,
      label: "Facebook",
      color: "#1877f2",
    },
    branding?.website && {
      Icon: Globe,
      href: branding.website,
      label: "Sitio web",
    },
  ].filter(Boolean) as Social[];

  // Estadísticas reales por tienda (beacon, no bloqueante).
  const trackStore = (type: string, productId?: string) => {
    try {
      const payload = JSON.stringify({ slug: store.storeSlug, type, productId });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon("/api/stores/track", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/stores/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
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
    <main className="min-h-screen bg-white font-outfit text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {logo ? (
              <Image src={logo} alt={name} fill sizes="36px" className="object-contain p-1" unoptimized={logoUnoptimized} />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-black" style={{ color: primary }}>
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="truncate font-bold text-slate-900">{name}</span>
          <form onSubmit={onSearch} className="ml-auto hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 sm:flex">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar en esta tienda"
              aria-label="Buscar en la tienda"
              className="w-44 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </form>
        </div>
      </header>

      {/* Banner */}
      <section
        className="relative h-44 w-full overflow-hidden md:h-64"
        style={banner ? undefined : { background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
      >
        {banner && (
          <Image src={banner} alt={`Banner de ${name}`} fill priority sizes="100vw" className="object-cover" unoptimized={bannerUnoptimized} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-6xl px-4 pb-4">
          <div className="flex items-end gap-4">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-lg md:h-24 md:w-24">
              {logo ? (
                <Image src={logo} alt={name} fill sizes="96px" className="object-contain p-2" unoptimized={logoUnoptimized} />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-black" style={{ color: primary }}>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="pb-1 text-white">
              <h1 className="text-2xl font-black drop-shadow md:text-4xl">{name}</h1>
              {shortDesc && <p className="mt-0.5 max-w-2xl text-sm text-white/90 drop-shadow">{shortDesc}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Info + acciones */}
      <section className="mx-auto max-w-6xl px-4 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
            <Package className="h-3.5 w-3.5" /> {store.productCount} productos
          </span>
          {location && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
              <MapPin className="h-3.5 w-3.5" /> {location}
            </span>
          )}
          {branding?.whatsapp && (
            <a
              href={waLink(branding.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent("store_whatsapp_click", { store: store.storeSlug });
                trackStore("whatsapp_click");
              }}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold text-white"
              style={{ background: "#16a34a" }}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}

          {/* Redes sociales */}
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-transparent hover:text-white"
              style={{ ["--hover-bg" as string]: s.color }}
              onMouseEnter={(e) => { if (s.color) { e.currentTarget.style.background = s.color; e.currentTarget.style.borderColor = s.color; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.borderColor = ""; }}
            >
              <s.Icon className="h-4 w-4" />
            </a>
          ))}
        </div>

        {desc && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-600">{desc}</p>}
      </section>

      {/* Productos */}
      <section className="mx-auto max-w-6xl px-4 pt-8 pb-10">
        {store.products.length > 0 ? (
          <>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">Productos</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {store.products.map((p, i) => (
                <Reveal key={p.id} delay={Math.min(i, 7) * 0.04} className="h-full">
                  <Link
                    href={`/product/${p.id}`}
                    onClick={() => {
                      trackEvent("store_product_click", { product_id: p.id, store: store.storeSlug });
                      trackStore("product_click", p.id);
                    }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-square bg-slate-50">
                      {p.image ? (
                        <OptimizedProductImage
                          src={p.image}
                          title={p.title}
                          category={p.categoryName}
                          fill
                          sizes="(max-width:768px) 50vw, 25vw"
                          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <h2 className="line-clamp-2 min-h-[32px] text-xs font-medium leading-snug text-slate-700">{p.title}</h2>
                      <p className="mt-auto text-base font-bold" style={{ color: primary }}>
                        ${p.price.toLocaleString("es-AR")}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700">Esta tienda aún no tiene productos</p>
            <p className="mt-1 text-sm text-slate-400">Volvé pronto para ver las novedades.</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href={`/search?seller=${store.id}`}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-sm"
            style={{ background: primary }}
          >
            Ver todo el catálogo <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Info del local: contacto + Google Maps */}
      {(address || phone || branding?.email || socials.length > 0) && (
        <section className="border-t border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">Encontranos</p>

            <div className={`grid gap-8 ${address ? "lg:grid-cols-2" : ""}`}>
              {/* Datos de contacto */}
              <div className="flex flex-col gap-4">
                {address && (
                  <a
                    href={mapsLink(address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Dirección</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{address}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600">
                        Ver en Google Maps <ExternalLink className="h-3 w-3" />
                      </p>
                    </div>
                  </a>
                )}

                {branding?.whatsapp && (
                  <a
                    href={waLink(branding.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-green-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">WhatsApp</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{phone}</p>
                    </div>
                  </a>
                )}

                {branding?.email && (
                  <a
                    href={`mailto:${branding.email}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Email</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-800">{branding.email}</p>
                    </div>
                  </a>
                )}

                {/* Redes sociales en lista */}
                {socials.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="mb-3 text-xs font-semibold text-slate-500">Redes sociales</p>
                    <div className="flex flex-col gap-2">
                      {socials.map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-sm font-medium text-slate-700 hover:text-slate-900"
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: s.color ? `${s.color}18` : "#f1f5f9" }}>
                            <s.Icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                          </span>
                          {s.label}
                          {s.href.includes("instagram") && branding?.instagram && !branding.instagram.startsWith("http") && (
                            <span className="text-slate-400">@{branding.instagram}</span>
                          )}
                          {s.href.includes("tiktok") && branding?.tiktok && !branding.tiktok.startsWith("http") && (
                            <span className="text-slate-400">@{branding.tiktok}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Google Maps embed */}
              {address && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                  <iframe
                    title={`Ubicación de ${name}`}
                    src={mapsEmbedUrl(address)}
                    width="100%"
                    height="340"
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

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 text-center">
          <Link href="/crear-tienda-online" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900">
            <Store className="h-4 w-4" /> Tienda creada con Madsjeez
          </Link>
          <p className="text-xs text-slate-400">Creá tu propia tienda online en Madsjeez.</p>
        </div>
      </footer>
    </main>
  );
}

export default StorefrontView;
