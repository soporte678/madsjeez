"use client"

import React, { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Package, Zap } from 'lucide-react'
import Link from 'next/link'

export interface CarouselProduct {
  id: string | number
  title: string
  price: number
  original_price?: number | null
  originalPrice?: number | null
  image?: string | null
  free_shipping?: boolean
  sales?: number
  discount?: string | null
  installments?: string | null
  volumePrice?: string | null
  exclusive?: boolean
  isFlash?: boolean
  shipping?: string | null
}

interface ProductCarouselProps {
  title: string
  products: CarouselProduct[]
  linkText?: string
  autoRotate?: boolean
  rotateIntervalMs?: number
}

const formatPrice = (price: number) => {
  return `$ ${price.toLocaleString('es-AR')}`
}

export function ProductCarousel({
  title,
  products,
  linkText,
  autoRotate = true,
  rotateIntervalMs = 6000,
}: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth
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
    if (!autoRotate || !el || products.length <= 1) return

    const rotate = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el
      const nextLeft = scrollLeft + clientWidth
      const maxLeft = scrollWidth - clientWidth

      el.scrollTo({
        left: nextLeft >= maxLeft - 10 ? 0 : nextLeft,
        behavior: "smooth",
      })
    }

    const interval = setInterval(rotate, rotateIntervalMs)
    return () => clearInterval(interval)
  }, [autoRotate, products.length, rotateIntervalMs])

  if (products.length === 0) return null

  return (
    <div className="w-full max-w-[1184px] bg-card rounded shadow-sm relative group mb-8">
      <div className="flex items-center gap-4 px-6 pt-6 pb-2">
        <h2 className="text-[22px] font-normal text-foreground">{title}</h2>
        {linkText && (
          <Link href="/search" className="text-[14px] text-primary font-normal hover:text-primary/80 transition-colors mt-1">
            {linkText}
          </Link>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => {
          const origPrice = product.original_price || product.originalPrice
          return (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="flex-none w-[224px] snap-start p-4 group/card cursor-pointer transition-all"
            >
              <div className="bg-card group-hover/card:shadow-[0_7px_16px_0_rgba(0,0,0,0.1)] transition-shadow duration-300 rounded pb-4 h-full flex flex-col relative">
                <div className="h-[200px] w-full mb-4 border-b border-border group-hover/card:border-transparent transition-colors overflow-hidden bg-card">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="px-4 flex flex-col flex-grow">
                  <h3 className="text-[14px] leading-[1.3] text-muted-foreground font-light line-clamp-2 mb-2 min-h-[36px]">
                    {product.title}
                  </h3>

                  <div className="flex flex-col mb-1">
                    {origPrice && origPrice > product.price && (
                      <span className="text-[12px] text-muted-foreground/80 line-through mb-0.5 block">
                        {formatPrice(origPrice)}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[24px] text-foreground font-normal leading-none">
                        {formatPrice(product.price)}
                      </span>
                      {product.discount && (
                        <span className="text-[14px] text-success font-normal leading-none">
                          {product.discount}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.installments && (
                    <div className="text-[14px] text-success font-normal leading-tight mb-1">
                      {product.installments}
                    </div>
                  )}

                  {product.volumePrice && (
                    <div className="mt-1 mb-1">
                      <span className="text-[12px] bg-secondary text-primary px-1 py-0.5 rounded font-medium">
                        {product.volumePrice}
                      </span>
                    </div>
                  )}

                  {product.exclusive && (
                    <div className="text-[11px] text-foreground font-bold italic uppercase mt-1 mb-1">
                      EXCLUSIVO NEGOCIOS
                    </div>
                  )}

                  <div className="text-[14px] text-success font-semibold flex items-center gap-1 mt-auto pt-2">
                    {product.shipping || 'Llega mañana'}
                    {product.isFlash && (
                      <span className="text-success font-black italic text-[12px] flex items-center ml-1">
                        <Zap className="w-3 h-4 fill-current mr-0.5" />
                        FLASH
                      </span>
                    )}
                    {!product.isFlash && product.free_shipping && (
                      <span className="text-success font-black italic text-[12px] flex items-center ml-1">
                        <svg className="w-3 h-4 fill-current mr-0.5" viewBox="0 0 10 16"><path d="M6.286 0L0 9.143h4.571L3.714 16 10 6.857H5.429z" /></svg>
                        FULL
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {showLeftArrow && (
        <button
          onClick={(e) => { e.preventDefault(); scroll('left') }}
          className="absolute left-[-24px] top-[55%] -translate-y-1/2 bg-card border border-border w-16 h-16 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-primary hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10"
        >
          <ChevronLeft size={32} strokeWidth={2} />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={(e) => { e.preventDefault(); scroll('right') }}
          className="absolute right-[-24px] top-[55%] -translate-y-1/2 bg-card border border-border w-16 h-16 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-primary hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={32} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
