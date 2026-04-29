"use client"

import { useState } from "react"
import { Heart, Package } from "lucide-react"

interface ProductDetailClientProps {
  images: string[]
  title: string
}

export function ProductDetailClient({ images, title }: ProductDetailClientProps) {
  const [activeImage, setActiveImage] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-[60%]">
        <div className="flex-1 flex items-center justify-center relative min-h-[350px] bg-gray-100 rounded-lg">
          <Package className="h-24 w-24 text-gray-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 w-full md:w-[60%]">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        {images.map((img, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setActiveImage(idx)}
            className={`w-12 h-12 rounded border-2 p-0.5 cursor-pointer shrink-0 transition-colors ${
              activeImage === idx ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <img src={img} alt={`${title} - ${idx + 1}`} className="w-full h-full object-contain" />
          </div>
        ))}
      </div>
      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
        <img
          src={images[activeImage]}
          alt={title}
          className="max-w-full max-h-[450px] object-contain cursor-zoom-in"
        />
        <button className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors bg-white/50 p-2 rounded-full backdrop-blur-sm">
          <Heart size={24} />
        </button>
      </div>
    </div>
  )
}
