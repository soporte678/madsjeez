"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Truck } from "lucide-react"
import { useRotatingProducts } from "@/hooks/useRotatingProducts"

interface RotatingProductCarouselProps {
  title: string
  subtitle?: string
  offset?: number
}

export function RotatingProductCarousel({ title, subtitle, offset = 0 }: RotatingProductCarouselProps) {
  const { products, loading, totalCount } = useRotatingProducts(offset)
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
            <h2 className="text-[22px] font-semibold text-[#333]">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="min-w-[224px] bg-white rounded-lg shadow-sm animate-pulse">
              <div className="h-[224px] bg-gray-200 rounded-t-lg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
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
            <h2 className="text-[22px] font-semibold text-[#333]">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-[#3483fa] font-semibold bg-blue-50 px-3 py-1 rounded-full">
              +{Math.max(50, Math.floor(totalCount / 10000) * 10).toLocaleString('es-AR')}.000 PRODUCTOS ESTIMATIVOS EN NUESTRO MARKETPLACE
            </span>
          )}
        </div>
        <Link href="/search" className="text-[#3483fa] text-sm font-medium hover:underline flex items-center gap-1">
          Ver más <ChevronRight size={16} />
        </Link>
      </div>

      {/* Scroll Buttons */}
      <button
        onClick={() => scroll("left")}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#3483fa] hover:bg-white transition-all duration-300 ${
          canScrollLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>
      <button
        onClick={() => scroll("right")}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-[#3483fa] hover:bg-white transition-all duration-300 ${
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
            className="min-w-[224px] max-w-[224px] bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer flex-shrink-0"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="relative h-[224px] overflow-hidden rounded-t-lg bg-gray-50">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="224px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
              
              {hoveredIndex === index && (
                <div className="absolute inset-0 bg-black/5 transition-opacity duration-300" />
              )}
            </div>

            <div className="p-3">
              <h3 className="text-[13px] text-[#333] font-normal leading-snug line-clamp-2 min-h-[40px] mb-2">
                {product.title}
              </h3>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-[17px] font-medium text-[#333]">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[12px] text-[#999] line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              )}

              {product.freeShipping && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 font-medium">
                  <Truck size={12} />
                  <span>Envío gratis</span>
                </div>
              )}

              {product.sellerName && (
                <div className="mt-2 text-[11px] text-gray-400">
                  por <span className="text-gray-500">{product.sellerName}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
