"use client"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Play, Package } from "lucide-react"

interface GalleryImage {
  id: string
  url: string
  alt: string | null
  order?: number
  is_primary?: boolean
}

export function ImageGallery({ images, title, videoUrl }: { images: GalleryImage[]; title: string; videoUrl?: string | null }) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showVideo, setShowVideo] = useState(false)

  const selected = images[selectedIndex]

  return (
    <div className="grid md:grid-cols-[80px_1fr] gap-4">
      {/* Thumbnails */}
      <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-y-auto md:max-h-[500px] scrollbar-thin">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => { setSelectedIndex(index); setShowVideo(false) }}
            className={`w-16 h-16 shrink-0 border-2 rounded-lg overflow-hidden transition-colors ${
              !showVideo && index === selectedIndex ? "border-[#3483FA]" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <img
              src={image.url}
              alt={image.alt || `${title} - ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {videoUrl && (
          <button
            onClick={() => setShowVideo(true)}
            className={`w-16 h-16 shrink-0 border-2 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 transition-colors ${
              showVideo ? "border-[#3483FA]" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <Play size={24} className="text-gray-500" />
          </button>
        )}
        {images.length > 7 && (
          <div className="w-16 h-16 shrink-0 border border-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-500 bg-gray-50">
            +{images.length - 7}
          </div>
        )}
      </div>

      {/* Main Image */}
      <div className="order-1 md:order-2 relative group">
        {showVideo && videoUrl ? (
          <div className="aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
            <video src={videoUrl} controls autoPlay className="max-w-full max-h-full" />
          </div>
        ) : selected ? (
          <div className="aspect-square bg-white rounded-lg overflow-hidden relative">
            <img
              src={selected.url}
              alt={selected.alt || title}
              className="w-full h-full object-contain cursor-zoom-in hover:scale-110 transition-transform duration-300"
            />
            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                {selectedIndex > 0 && (
                  <button
                    onClick={() => { setSelectedIndex(selectedIndex - 1); setShowVideo(false) }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={20} aria-hidden="true" />
                  </button>
                )}
                {selectedIndex < images.length - 1 && (
                  <button
                    onClick={() => { setSelectedIndex(selectedIndex + 1); setShowVideo(false) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight size={20} aria-hidden="true" />
                  </button>
                )}
              </>
            )}
            {/* Counter */}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Package className="h-24 w-24" />
          </div>
        )}
      </div>
    </div>
  )
}
