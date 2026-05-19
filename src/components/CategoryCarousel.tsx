"use client"

import React from "react"
import {
  CarFront,
  ChevronRight,
  Dumbbell,
  Gem,
  Hammer,
  Home,
  Laptop,
  MonitorSmartphone,
  Shirt,
  Smartphone,
  Sparkles,
  Tv,
} from "lucide-react"
import Link from "next/link"

export interface CategoryItem {
  id: number
  name: string
  image: string
  slug?: string
}

interface CategoryCarouselProps {
  categories: CategoryItem[]
}

const iconBySlug: Record<string, { Icon: React.ComponentType<{ className?: string }>; accent: string; ring: string }> = {
  "autos-motos": { Icon: CarFront, accent: "text-sky-300", ring: "from-sky-400/20 to-blue-500/10" },
  "accesorios-vehiculos": { Icon: CarFront, accent: "text-orange-300", ring: "from-orange-400/20 to-amber-500/10" },
  "hogar-muebles": { Icon: Home, accent: "text-cyan-200", ring: "from-cyan-400/20 to-slate-500/10" },
  celulares: { Icon: Smartphone, accent: "text-amber-200", ring: "from-amber-300/20 to-yellow-500/10" },
  "ropa-accesorios": { Icon: Shirt, accent: "text-slate-100", ring: "from-fuchsia-400/20 to-pink-500/10" },
  computacion: { Icon: Laptop, accent: "text-rose-200", ring: "from-rose-400/20 to-orange-500/10" },
  electrodomesticos: { Icon: Tv, accent: "text-violet-200", ring: "from-violet-400/20 to-fuchsia-500/10" },
  deportes: { Icon: Dumbbell, accent: "text-cyan-200", ring: "from-cyan-400/20 to-sky-500/10" },
  inmuebles: { Icon: Home, accent: "text-blue-100", ring: "from-blue-400/20 to-cyan-500/10" },
  herramientas: { Icon: Hammer, accent: "text-amber-100", ring: "from-amber-300/20 to-orange-500/10" },
  belleza: { Icon: Sparkles, accent: "text-pink-200", ring: "from-pink-400/20 to-rose-500/10" },
  electronica: { Icon: MonitorSmartphone, accent: "text-emerald-200", ring: "from-emerald-400/20 to-cyan-500/10" },
  agro: { Icon: Home, accent: "text-lime-200", ring: "from-lime-400/20 to-emerald-500/10" },
  alimentos: { Icon: Gem, accent: "text-yellow-100", ring: "from-yellow-400/20 to-orange-500/10" },
  juguetes: { Icon: Sparkles, accent: "text-fuchsia-200", ring: "from-fuchsia-400/20 to-violet-500/10" },
  mascotas: { Icon: Sparkles, accent: "text-teal-200", ring: "from-teal-400/20 to-cyan-500/10" },
  construccion: { Icon: Hammer, accent: "text-orange-200", ring: "from-orange-400/20 to-yellow-500/10" },
  camaras: { Icon: MonitorSmartphone, accent: "text-indigo-200", ring: "from-indigo-400/20 to-sky-500/10" },
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  return (
    <div className="mb-14 mt-6 w-full max-w-[1184px] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.62)_0%,rgba(15,23,42,0.34)_100%)] p-4 shadow-[0_24px_55px_rgba(2,6,23,0.16)] backdrop-blur-md md:p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1 sm:px-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300/90">Mapa comercial</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] font-black tracking-tight text-white">Categorías</h2>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              {categories.length} accesos rápidos
            </span>
          </div>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-slate-200 transition-all hover:border-sky-400/30 hover:bg-white/10 hover:text-white"
        >
          Ver catálogo completo
          <ChevronRight size={14} />
        </Link>
      </div>

      <div className="mb-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-[13px] leading-relaxed text-slate-300">
        Entrá rápido a los rubros con más intención de compra y llevá a los usuarios directo a las landings del marketplace.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-")
          const iconConfig = iconBySlug[slug]
          const Icon = iconConfig?.Icon

          return (
            <Link
              key={cat.id}
              href={`/category/${slug}`}
              className="group/cat relative flex min-h-[104px] w-full items-center rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.94)_100%)] px-4 py-3 shadow-[0_14px_34px_rgba(2,6,23,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-[0_18px_40px_rgba(14,116,244,0.16)] sm:px-5"
            >
              <div className="absolute inset-y-3 left-0 w-[4px] rounded-full bg-gradient-to-b from-[#38bdf8] via-[#3b82f6] to-[#f97316] opacity-80 transition-opacity group-hover/cat:opacity-100" />
              <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_45%)] opacity-90" />

              <div
                className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br sm:h-16 sm:w-16 ${iconConfig?.ring || "from-white/[0.08] to-white/[0.02]"} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent opacity-70" />
                {Icon ? (
                  <Icon className={`relative h-7 w-7 sm:h-8 sm:w-8 ${iconConfig.accent} drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]`} />
                ) : (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="relative h-9 w-9 object-contain brightness-125 contrast-125 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)] sm:h-10 sm:w-10"
                  />
                )}
              </div>

              <div className="relative ml-3 flex min-w-0 flex-1 flex-col sm:ml-4">
                <span className="line-clamp-2 text-[15px] font-bold leading-snug text-white transition-colors group-hover/cat:text-sky-100 sm:text-[16px]">
                  {cat.name}
                </span>
                <span className="mt-1.5 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-slate-400 transition-colors group-hover/cat:text-slate-200">
                  Explorar categoría
                  <ChevronRight size={14} className="transition-transform duration-300 group-hover/cat:translate-x-1" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
