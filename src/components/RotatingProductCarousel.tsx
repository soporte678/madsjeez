"use client"

import { useRef, useEffect, useCallback, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Truck } from "lucide-react"
import { useRotatingProducts } from "@/hooks/useRotatingProducts"

export interface RotatingProductCarouselProps {
  title: string
  subtitle?: string
  offset?: number
  categorySlug?: string
}

const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 })

function RotatingProductCarouselBase({ title, subtitle, offset = 0, categorySlug }: RotatingProductCarouselProps) {
  const { products, loading, totalCount } = useRotatingProducts({ offset, categorySlug })
  const scrollRef = useRef<HTMLDivElement>(null)
  const canScrollLeftRef = useRef<HTMLButtonElement>(null)
  const canScrollRightRef = useRef<HTMLButtonElement>(null)

  const checkScroll = useCallback(() => {
    requestAnimationFrame(() => {
      if (!scrollRef.current) return
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      if (canScrollLeftRef.current) canScrollLeftRef.current.style.opacity = scrollLeft > 10 ? "1" : "0"
      if (canScrollRightRef.current) canScrollRightRef.current.style.opacity = scrollLeft < scrollWidth - clientWidth - 10 ? "1" : "0"
    })
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true })
      return () => el.removeEventListener("scroll", checkScroll)
    }
  }, [products, checkScroll])

  const scroll = useCallback((direction: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" })
  }, [])

  const formatPrice = useCallback((price: number) => fmt.format(price), [])

  if (loading) {
    return (
      <div className="py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[22px] font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-w-[224px] bg-card rounded-lg shadow-sm animate-pulse">
              <div className="h-[224px] bg-secondary rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-secondary rounded w-3/4" />
                <div className="h-4 bg-secondary rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="py-6 relative group/carousel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-[22px] font-semibold text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-primary font-semibold bg-secondary px-3 py-1 rounded-full">
              +{Math.max(50, Math.floor(totalCount / 10000) * 10).toLocaleString('es-AR')}.000 PRODUCTOS ESTIMATIVOS EN NUESTRO MARKETPLACE
            </span>
          )}
        </div>
        <Link href="/search" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
          Ver más <ChevronRight size={16} />
        </Link>
      </div>

      {/* Scroll Buttons */}
      <button
        ref={canScrollLeftRef}
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center text-primary hover:bg-card transition-opacity duration-300 opacity-0 pointer-events-auto"
        aria-label="Ver productos anteriores"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <ChevronLeft size={24} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <button
        ref={canScrollRightRef}
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-card/90 border border-border shadow-lg flex items-center justify-center text-primary hover:bg-card transition-opacity duration-300 pointer-events-auto"
        aria-label="Ver más productos"
        style={{ minWidth: 44, minHeight: 44 }}
      >
        <ChevronRight size={24} strokeWidth={2.5} aria-hidden="true" />
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            href={`/product/${product.id}`}
            className="min-w-[200px] max-w-[200px] bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group cursor-pointer flex-shrink-0"
          >
            <div className="relative h-[200px] overflow-hidden rounded-t-lg bg-secondary">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  loading="lazy"
                  decoding="async"
                  className="object-cover group-hover:opacity-90 transition-opacity duration-200"
                  sizes="200px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="text-[13px] text-foreground font-normal leading-snug line-clamp-2 min-h-[40px] mb-2">
                {product.title}
              </h3>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[17px] font-medium text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[12px] text-muted-foreground/80 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-success font-medium">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}

              {product.freeShipping && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-success font-medium">
                  <Truck size={12} />
                  <span>Envío gratis</span>
                </div>
              )}

              {product.sellerName && (
                <div className="mt-2 text-[11px] text-muted-foreground">
                  por <span className="text-muted-foreground">{product.sellerName}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const RotatingProductCarousel = memo(RotatingProductCarouselBase)
