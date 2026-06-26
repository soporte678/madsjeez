"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { CategoryIcon } from "@/components/CategoryIcon"

const VISIBLE_COUNT = 9
const ROTATE_MS = 15_000
const REVERSE_EVERY_PAGES = 3

export type CarouselCategoryItem = {
  id: string
  name: string
  slug: string
  kind: "category" | "subcategory"
  parentName?: string
  iconName: string
  accent: string
  ring: string
}

function chunkPages<T>(items: T[], size: number): T[][] {
  if (!items.length) return []
  const pages: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

function CategoryCard({ item }: { item: CarouselCategoryItem }) {
  return (
    <Link
      href={`/category/${item.slug}`}
      className="group/cat relative flex min-h-[104px] w-full items-center rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82)_0%,rgba(15,23,42,0.94)_100%)] px-4 py-3 shadow-[0_14px_34px_rgba(2,6,23,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/30 hover:shadow-[0_18px_40px_rgba(14,116,244,0.16)] sm:px-5"
    >
      <div className="absolute inset-y-3 left-0 w-[4px] rounded-full bg-gradient-to-b from-[#38bdf8] via-[#3b82f6] to-[#f97316] opacity-80 transition-opacity group-hover/cat:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_45%)] opacity-90" />

      <div
        className={cn(
          "relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br sm:h-16 sm:w-16",
          item.ring,
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
        )}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.06] to-transparent opacity-70" />
        <CategoryIcon
          name={item.iconName}
          className={cn(
            "relative h-7 w-7 sm:h-8 sm:w-8 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]",
            item.accent
          )}
        />
      </div>

      <div className="relative ml-3 flex min-w-0 flex-1 flex-col sm:ml-4">
        {item.kind === "subcategory" && item.parentName && (
          <span className="mb-0.5 line-clamp-1 text-[10px] font-bold uppercase tracking-wide text-sky-300/80">
            {item.parentName}
          </span>
        )}
        <span className="line-clamp-2 text-[15px] font-bold leading-snug text-white transition-colors group-hover/cat:text-sky-100 sm:text-[16px]">
          {item.name}
        </span>
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-slate-400 transition-colors group-hover/cat:text-slate-200">
          {item.kind === "subcategory" ? "Explorar subcategoría" : "Explorar categoría"}
          <ChevronRight size={14} className="transition-transform duration-300 group-hover/cat:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

export function CategoryCarousel() {
  const [items, setItems] = useState<CarouselCategoryItem[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const directionRef = useRef<1 | -1>(1)
  const pagesSinceReverseRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/categories/carousel")
      .then((r) => r.json())
      .then((data: { items?: CarouselCategoryItem[] }) => {
        if (cancelled) return
        setItems(Array.isArray(data.items) ? data.items : [])
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const pages = useMemo(() => chunkPages(items, VISIBLE_COUNT), [items])
  const totalAccess = items.length
  const currentPage = pages[pageIndex] || []

  const go = useCallback(
    (delta: number) => {
      if (pages.length <= 1) return
      setPageIndex((prev) => {
        const next = prev + delta
        if (next >= pages.length) return pages.length - 1
        if (next < 0) return 0
        return next
      })
    },
    [pages.length]
  )

  useEffect(() => {
    if (pages.length <= 1) return

    directionRef.current = 1
    pagesSinceReverseRef.current = 0
    setPageIndex(0)

    const interval = setInterval(() => {
      setPageIndex((prev) => {
        const last = pages.length - 1
        let dir = directionRef.current
        let next = prev + dir

        if (next >= last) {
          next = last
          dir = -1
          pagesSinceReverseRef.current = 0
        } else if (next <= 0) {
          next = 0
          dir = 1
          pagesSinceReverseRef.current = 0
        } else {
          pagesSinceReverseRef.current += 1
          if (pagesSinceReverseRef.current >= REVERSE_EVERY_PAGES) {
            dir = dir === 1 ? -1 : 1
            pagesSinceReverseRef.current = 0
          }
        }

        directionRef.current = dir
        return next
      })
    }, ROTATE_MS)

    return () => clearInterval(interval)
  }, [pages.length])

  return (
    <div className="group relative mb-14 mt-6 w-full max-w-[1184px] rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.62)_0%,rgba(15,23,42,0.34)_100%)] p-4 shadow-[0_24px_55px_rgba(2,6,23,0.16)] backdrop-blur-md md:p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 px-1 sm:px-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-300/90">
            Mapa comercial
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-[26px] font-black tracking-tight text-white">Categorías</h2>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              {totalAccess > 0 ? `${totalAccess} accesos rápidos` : "Cargando…"}
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
        Entrá rápido a los rubros con más intención de compra y llevá a los usuarios directo a las
        landings del marketplace.
      </div>

      <div className="group/catcarousel relative overflow-hidden rounded-[20px]">
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
              <div
                key={i}
                className="min-h-[104px] animate-pulse rounded-[22px] border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : currentPage.length > 0 ? (
          <div
            key={pageIndex}
            className="grid grid-cols-1 gap-3 animate-in fade-in duration-500 sm:grid-cols-2 lg:grid-cols-3"
          >
            {currentPage.map((item) => (
              <CategoryCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">No hay categorías disponibles.</p>
        )}

        {pages.length > 1 && !loading && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={pageIndex === 0}
              className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.92)] text-slate-100 shadow-lg backdrop-blur-md transition-opacity duration-200 hover:border-sky-400/30 opacity-0 group-hover/catcarousel:opacity-100 disabled:opacity-0 sm:left-3"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={pageIndex >= pages.length - 1}
              className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.92)] text-slate-100 shadow-lg backdrop-blur-md transition-opacity duration-200 hover:border-sky-400/30 opacity-0 group-hover/catcarousel:opacity-100 disabled:opacity-0 sm:right-3"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {pages.length > 1 && !loading && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPageIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === pageIndex ? "w-6 bg-orange-400" : "w-2 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Página ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

