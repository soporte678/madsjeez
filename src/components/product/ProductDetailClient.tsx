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
      <div className="flex gap-4 w-full md:w-[55%]">
        <div className="w-[50px] flex-shrink-0" />
        <div className="flex-1 flex items-center justify-center relative aspect-square bg-gray-50 rounded">
          <Package className="h-24 w-24 text-gray-300" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 w-full md:w-[55%]">
      {/* Thumbnails - Left Column */}
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        {images.map((img, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setActiveImage(idx)}
            onClick={() => setActiveImage(idx)}
            className={`w-[50px] h-[50px] rounded-[4px] border p-[3px] cursor-pointer transition-all ${
              activeImage === idx
                ? "border-[#3483fa] shadow-[0_0_0_1px_#3483fa]"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <img
              src={img}
              alt={`${title} - ${idx + 1}`}
              className="w-full h-full object-contain rounded-sm"
            />
          </div>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative aspect-square max-h-[500px]">
        <img
          src={images[activeImage]}
          alt={title}
          className="max-w-full max-h-full object-contain cursor-crosshair"
        />
        <button className="absolute top-2 right-2 text-[#3483fa] hover:text-blue-700 transition-colors">
          <Heart size={24} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
