"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Truck } from "lucide-react"
import { useRotatingProducts } from "@/hooks/useRotatingProducts"
import { OptimizedProductImage } from "@/components/product/OptimizedProductImage"

export interface RotatingProductCarouselProps {
  title: string
  subtitle?: string
  offset?: number
  categorySlug?: string | null
  autoScroll?: boolean
  scrollIntervalMs?: number
}

export function RotatingProductCarousel({
  title,
  subtitle,
  offset = 0,
  categorySlug = null,
  autoScroll = true,
  scrollIntervalMs = 5500,
}: RotatingProductCarouselProps) {
  const { products, loading, totalCount } = useRotatingProducts({ offset, categorySlug })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const displayProducts = products

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (el) {
      el.addEventListener("scroll", checkScroll)
      return () => el.removeEventListener("scroll", checkScroll)
    }
  }, [displayProducts])

  useEffect(() => {
    const el = scrollRef.current
    if (!autoScroll || !el || displayProducts.length <= 2) return

    const tick = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el
      const nextLeft = scrollLeft + clientWidth * 0.85
      const maxLeft = scrollWidth - clientWidth
      el.scrollTo({
        left: nextLeft >= maxLeft - 8 ? 0 : nextLeft,
        behavior: "smooth",
      })
    }

    const interval = setInterval(tick, scrollIntervalMs)
    return () => clearInterval(interval)
  }, [autoScroll, displayProducts.length, scrollIntervalMs])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(price)
  }

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

  if (displayProducts.length === 0) {
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
        onClick={() => scroll("left")}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-card/90 border border-border backdrop-blur-sm shadow-lg flex items-center justify-center text-primary hover:bg-card transition-all duration-300 ${
          canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => scroll("right")}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-card/90 border border-border backdrop-blur-sm shadow-lg flex items-center justify-center text-primary hover:bg-card transition-all duration-300 ${
          canScrollRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
        }`}
      >
        <ChevronRight size={28} strokeWidth={2.5} />
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayProducts.map((product, index) => (
          <Link
            key={`${product.id}-${index}`}
            href={`/product/${product.id}`}
            className="min-w-[224px] max-w-[224px] bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex-shrink-0"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative h-[224px] overflow-hidden rounded-t-lg bg-secondary">
              {product.image ? (
                <OptimizedProductImage
                  src={product.image}
                  title={product.title}
                  category={product.category}
                  sellerName={product.sellerName}
                  fill
                  sizes="224px"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
              
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-black/5 transition-opacity duration-300" />
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
                  por <span className="text-muted-foreground/90">{product.sellerName}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
