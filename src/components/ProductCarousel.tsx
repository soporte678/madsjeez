"use client"

import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Package } from 'lucide-react'
import Link from 'next/link'

interface CarouselProduct {
  id: string
  title: string
  price: number
  original_price?: number | null
  image?: string | null
  free_shipping?: boolean
  sales?: number
}

interface ProductCarouselProps {
  title: string
  products: CarouselProduct[]
}

const formatPrice = (price: number) => {
  return `$ ${price.toLocaleString('es-AR')}`
}

export function ProductCarousel({ title, products }: ProductCarouselProps) {
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

  if (products.length === 0) return null

  return (
    <div className="w-full max-w-[1184px] bg-white rounded shadow-sm relative group mb-8">
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <h2 className="text-[22px] font-normal text-[#333333]">{title}</h2>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 px-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex-none w-[224px] snap-start p-4 group/card cursor-pointer transition-all"
          >
            <div className="bg-white group-hover/card:shadow-[0_7px_16px_0_rgba(0,0,0,0.1)] transition-shadow duration-300 rounded pb-4 h-full flex flex-col">
              <div className="h-[224px] w-full flex items-center justify-center mb-4 p-2 border-b border-gray-100 group-hover/card:border-transparent transition-colors">
                {product.image ? (
                  <img src={product.image} alt={product.title} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Package className="h-16 w-16 text-gray-300" />
                )}
              </div>
              <div className="px-4 flex flex-col flex-grow">
                <h3 className="text-[14px] leading-[1.3] text-[#666] font-light line-clamp-2 mb-2 min-h-[36px]">
                  {product.title}
                </h3>
                <div className="text-[24px] text-[#333] font-normal mb-1">
                  {formatPrice(product.price)}
                </div>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-[12px] text-gray-400 line-through mb-1">
                    {formatPrice(product.original_price)}
                  </span>
                )}
                <div className="text-[14px] text-[#00a650] font-semibold flex items-center gap-1 mt-auto">
                  Llega mañana
                  {product.free_shipping && (
                    <span className="text-[#00a650] font-black italic text-[12px] flex items-center ml-1">
                      <svg className="w-3 h-4 fill-current mr-0.5" viewBox="0 0 10 16"><path d="M6.286 0L0 9.143h4.571L3.714 16 10 6.857H5.429z" /></svg>
                      FULL
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-24px] top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-[#3483fa] hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10"
        >
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-24px] top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-[#3483fa] hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
