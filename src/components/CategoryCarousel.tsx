"use client"

import React, { useEffect, useRef, useState } from 'react'
import {
  CarFront,
  ChevronLeft,
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
} from 'lucide-react'
import Link from 'next/link'

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
  'autos-motos': { Icon: CarFront, accent: 'text-sky-300', ring: 'from-sky-400/20 to-blue-500/10' },
  'accesorios-vehiculos': { Icon: CarFront, accent: 'text-orange-300', ring: 'from-orange-400/20 to-amber-500/10' },
  'hogar-muebles': { Icon: Home, accent: 'text-cyan-200', ring: 'from-cyan-400/20 to-slate-500/10' },
  'celulares': { Icon: Smartphone, accent: 'text-amber-200', ring: 'from-amber-300/20 to-yellow-500/10' },
  'ropa-accesorios': { Icon: Shirt, accent: 'text-slate-100', ring: 'from-fuchsia-400/20 to-pink-500/10' },
  'computacion': { Icon: Laptop, accent: 'text-rose-200', ring: 'from-rose-400/20 to-orange-500/10' },
  'electrodomesticos': { Icon: Tv, accent: 'text-violet-200', ring: 'from-violet-400/20 to-fuchsia-500/10' },
  'deportes': { Icon: Dumbbell, accent: 'text-cyan-200', ring: 'from-cyan-400/20 to-sky-500/10' },
  'inmuebles': { Icon: Home, accent: 'text-blue-100', ring: 'from-blue-400/20 to-cyan-500/10' },
  'herramientas': { Icon: Hammer, accent: 'text-amber-100', ring: 'from-amber-300/20 to-orange-500/10' },
  'belleza': { Icon: Sparkles, accent: 'text-pink-200', ring: 'from-pink-400/20 to-rose-500/10' },
  'electronica': { Icon: MonitorSmartphone, accent: 'text-emerald-200', ring: 'from-emerald-400/20 to-cyan-500/10' },
  'agro': { Icon: Home, accent: 'text-lime-200', ring: 'from-lime-400/20 to-emerald-500/10' },
  'alimentos': { Icon: Gem, accent: 'text-yellow-100', ring: 'from-yellow-400/20 to-orange-500/10' },
  'juguetes': { Icon: Sparkles, accent: 'text-fuchsia-200', ring: 'from-fuchsia-400/20 to-violet-500/10' },
  'mascotas': { Icon: Sparkles, accent: 'text-teal-200', ring: 'from-teal-400/20 to-cyan-500/10' },
  'construccion': { Icon: Hammer, accent: 'text-orange-200', ring: 'from-orange-400/20 to-yellow-500/10' },
  'camaras': { Icon: MonitorSmartphone, accent: 'text-indigo-200', ring: 'from-indigo-400/20 to-sky-500/10' },
}

const SCROLL_INTERVAL_MS = 15_000
/** Cada cuántos desplazamientos se invierte el sentido (además del rebote en los bordes). */
const REVERSE_EVERY_TICKS = 3

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollDirectionRef = useRef<1 | -1>(1)
  const ticksSinceReverseRef = useRef(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollTo = direction === 'left' ? scrollLeft - (clientWidth * 0.8) : scrollLeft + (clientWidth * 0.8)
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el || categories.length <= 3) return

    scrollDirectionRef.current = 1
    ticksSinceReverseRef.current = 0

    const interval = setInterval(() => {
      const { scrollLeft, clientWidth, scrollWidth } = el
      const step = clientWidth * 0.75
      const maxLeft = Math.max(0, scrollWidth - clientWidth)
      let direction = scrollDirectionRef.current

      let next = scrollLeft + direction * step

      if (next <= 0) {
        next = 0
        direction = 1
        ticksSinceReverseRef.current = 0
      } else if (next >= maxLeft - 8) {
        next = maxLeft
        direction = -1
        ticksSinceReverseRef.current = 0
      } else {
        ticksSinceReverseRef.current += 1
        if (ticksSinceReverseRef.current >= REVERSE_EVERY_TICKS) {
          direction = direction === 1 ? -1 : 1
          ticksSinceReverseRef.current = 0
        }
      }

      scrollDirectionRef.current = direction
      el.scrollTo({ left: next, behavior: "smooth" })
    }, SCROLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [categories.length])

  return (
    <div className="group relative mb-14 mt-6 w-full max-w-[1184px] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.62)_0%,rgba(15,23,42,0.34)_100%)] p-4 shadow-[0_24px_55px_rgba(2,6,23,0.16)] backdrop-blur-md md:p-5">
      <div className="mb-5 flex items-end justify-between gap-4 px-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300/90">Mapa comercial</p>
          <div className="mt-1 flex items-center gap-4">
            <h2 className="text-[26px] font-black tracking-tight text-white">Categorías</h2>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300 md:inline-flex">
              18 accesos rápidos
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

      <div className="mb-4 rounded-2xl border border-white/8 bg-black/10 px-4 py-3 text-[13px] text-slate-300">
        Entrá rápido a los rubros con más intención de compra y llevá a los usuarios directo a las landings del marketplace.
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="grid auto-cols-max grid-flow-col grid-rows-3 gap-x-4 gap-y-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group/cat relative flex h-[104px] w-[292px] items-center overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.94)_100%)] px-5 shadow-[0_14px_34px_rgba(2,6,23,0.18)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/30 hover:shadow-[0_18px_40px_rgba(14,116,244,0.16)]"
            >
              <div className="absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-[#38bdf8] via-[#3b82f6] to-[#f97316] opacity-80 transition-opacity group-hover/cat:opacity-100" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_45%)] opacity-90" />
              {(() => {
                const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')
                const iconConfig = iconBySlug[slug]
                const Icon = iconConfig?.Icon

                return (
                  <div className={`relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${iconConfig?.ring || 'from-white/[0.08] to-white/[0.02]'} shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent opacity-70" />
                    {Icon ? (
                      <Icon className={`relative h-8 w-8 ${iconConfig.accent} drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]`} />
                    ) : (
                      <img src={cat.image} alt={cat.name} className="relative h-10 w-10 object-contain brightness-125 contrast-125 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]" />
                    )}
                  </div>
                )
              })()}
              <div className="relative ml-4 flex min-w-0 flex-1 flex-col">
                <span className="text-[16px] font-bold leading-tight text-white transition-colors group-hover/cat:text-sky-100">
                  {cat.name}
                </span>
                <span className="mt-2 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-slate-400 transition-colors group-hover/cat:text-slate-200">
                  Explorar categoría
                  <ChevronRight size={14} className="transition-transform duration-300 group-hover/cat:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-18px] top-[60%] z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.92)] text-slate-100 shadow-[0_16px_38px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all hover:border-sky-400/30 hover:text-white"
        >
          <ChevronLeft size={28} strokeWidth={2.1} />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-18px] top-[60%] z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.92)] text-slate-100 opacity-0 shadow-[0_16px_38px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-all hover:border-sky-400/30 hover:text-white group-hover:opacity-100"
        >
          <ChevronRight size={28} strokeWidth={2.1} />
        </button>
      )}
    </div>
  )
}
