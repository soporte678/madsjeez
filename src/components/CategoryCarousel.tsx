"use client"

import React, { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
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

  return (
    <div className="w-full max-w-[1184px] bg-transparent rounded relative group mb-12 mt-4">
      <div className="flex items-center gap-4 px-2 mb-4">
        <h2 className="text-[22px] font-normal text-[#333333]">Categorías</h2>
        <Link href="/search" className="text-[14px] text-[#3483fa] font-normal hover:text-[#2968c8] transition-colors mt-1">
          Mostrar todas las categorías
        </Link>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="grid grid-rows-3 grid-flow-col gap-x-3 gap-y-3 auto-cols-max">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-[280px] h-[90px] bg-white rounded flex items-center px-6 cursor-pointer hover:shadow-[0_2px_4px_0_rgba(0,0,0,.1)] hover:text-[#3483fa] transition-all group/cat"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={cat.image} alt={cat.name} className="w-10 h-10 object-cover mix-blend-multiply" />
              </div>
              <span className="ml-4 text-[15px] text-[#333] font-normal leading-tight group-hover/cat:text-[#3483fa] transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-[-24px] top-[60%] -translate-y-1/2 bg-white w-16 h-16 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-[#3483fa] hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10"
        >
          <ChevronLeft size={32} strokeWidth={2} />
        </button>
      )}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-[-24px] top-[60%] -translate-y-1/2 bg-white w-16 h-16 rounded-full shadow-[0_2px_4px_0_rgba(0,0,0,.19)] flex items-center justify-center text-[#3483fa] hover:shadow-[0_4px_8px_0_rgba(0,0,0,.19)] transition-shadow z-10 opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={32} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}
