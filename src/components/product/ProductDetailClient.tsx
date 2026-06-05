"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Heart, Package, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { buildProductImageAlt } from "@/lib/seo/product-image-alt"

interface ProductDetailClientProps {
  images: string[]
  title: string
}

/** Detect video by extension. Storage paths use .mp4 / .webm / .mov. */
function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url || "")
}

export function ProductDetailClient({ images, title }: ProductDetailClientProps) {
  const [activeImage, setActiveImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const openZoom = useCallback((idx?: number) => {
    if (idx !== undefined) setActiveImage(idx)
    setZoomScale(1)
    setZoomPos({ x: 0, y: 0 })
    setZoomOpen(true)
  }, [])

  const closeZoom = useCallback(() => {
    setZoomOpen(false)
    setDragging(false)
  }, [])

  const handleZoomWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoomScale((s) => Math.min(Math.max(s + (e.deltaY < 0 ? 0.3 : -0.3), 1), 5))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomScale <= 1) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, posX: zoomPos.x, posY: zoomPos.y }
  }, [zoomScale, zoomPos])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setZoomPos({ x: dragStart.current.posX + dx, y: dragStart.current.posY + dy })
  }, [dragging])

  const handleMouseUp = useCallback(() => setDragging(false), [])

  const nextImage = useCallback(() => {
    setActiveImage((i) => (i + 1) % images.length)
    setZoomScale(1)
    setZoomPos({ x: 0, y: 0 })
  }, [images.length])

  const prevImage = useCallback(() => {
    setActiveImage((i) => (i - 1 + images.length) % images.length)
    setZoomScale(1)
    setZoomPos({ x: 0, y: 0 })
  }, [images.length])

  useEffect(() => {
    if (!zoomOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom()
      if (e.key === "ArrowRight") nextImage()
      if (e.key === "ArrowLeft") prevImage()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [zoomOpen, closeZoom, nextImage, prevImage])

  if (images.length === 0) {
    return (
      <div className="flex gap-4 w-full md:w-[55%] flex-shrink-0">
        <div className="w-[50px] flex-shrink-0" />
        <div className="flex-1 flex items-center justify-center relative aspect-square bg-gray-50 rounded overflow-hidden">
          <Package className="h-24 w-24 text-gray-300" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-3 w-full md:w-[55%] flex-shrink-0 overflow-hidden">
        {/* Thumbnails - Left Column */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 max-h-[500px] overflow-y-auto scrollbar-hide">
          {images.map((img, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setActiveImage(idx)}
              onClick={() => setActiveImage(idx)}
              className={`w-[50px] h-[50px] rounded-[4px] border p-[3px] cursor-pointer transition-all flex-shrink-0 ${
                activeImage === idx
                  ? "border-[#3483fa] shadow-[0_0_0_1px_#3483fa]"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              {isVideoUrl(img) ? (
                <div className="relative w-full h-full">
                  <video
                    src={img}
                    className="w-full h-full object-contain rounded-sm"
                    muted
                    preload="metadata"
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-sm">
                    <Play size={16} className="text-white drop-shadow" fill="white" />
                  </div>
                </div>
              ) : (
                <img
                  src={img}
                  alt={buildProductImageAlt({ title, index: idx })}
                  className="w-full h-full object-contain rounded-sm"
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              )}
            </div>
          ))}
        </div>

        {/* Main Image */}
        <div
          className="flex-1 flex items-center justify-center relative aspect-square max-h-[500px] overflow-hidden"
          onClick={() => { if (!isVideoUrl(images[activeImage])) openZoom() }}
        >
          {isVideoUrl(images[activeImage]) ? (
            <video
              src={images[activeImage]}
              className="max-w-full max-h-full object-contain"
              controls
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={images[activeImage]}
              alt={buildProductImageAlt({ title, index: activeImage })}
              className="max-w-full max-h-full object-contain cursor-zoom-in"
              fetchPriority="high"
              decoding="async"
            />
          )}
          <button className="absolute top-2 right-2 text-[#3483fa] hover:text-blue-700 transition-colors z-10"
            onClick={(e) => { e.stopPropagation() }}
          >
            <Heart size={24} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeZoom}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <span className="text-white/70 text-sm">{activeImage + 1} / {images.length}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setZoomScale((s) => Math.min(s + 0.5, 5)) }}
              className="text-white/80 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
              title="Acercar"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setZoomScale((s) => Math.max(s - 0.5, 1)); setZoomPos({ x: 0, y: 0 }) }}
              className="text-white/80 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
              title="Alejar"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeZoom() }}
              className="text-white/80 hover:text-white bg-white/10 rounded-full p-2 transition-colors"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-50"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-50"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Zoomable Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleZoomWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoomScale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
          >
            {isVideoUrl(images[activeImage]) ? (
              <video
                src={images[activeImage]}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                controls
                autoPlay
                loop
                playsInline
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={images[activeImage]}
                alt={title}
                className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-150"
                style={{
                  transform: `scale(${zoomScale}) translate(${zoomPos.x / zoomScale}px, ${zoomPos.y / zoomScale}px)`,
                }}
                draggable={false}
                onClick={(e) => {
                  e.stopPropagation()
                  if (zoomScale < 3) {
                    setZoomScale((s) => s + 1)
                  } else {
                    setZoomScale(1)
                    setZoomPos({ x: 0, y: 0 })
                  }
                }}
              />
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveImage(idx)
                    setZoomScale(1)
                    setZoomPos({ x: 0, y: 0 })
                  }}
                  className={`w-[48px] h-[48px] rounded border-2 p-[2px] transition-all ${
                    activeImage === idx
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {isVideoUrl(img) ? (
                    <div className="relative w-full h-full">
                      <video src={img} className="w-full h-full object-contain rounded-sm" muted preload="metadata" playsInline />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-sm">
                        <Play size={14} className="text-white drop-shadow" fill="white" />
                      </div>
                    </div>
                  ) : (
                    <img src={img} alt="" className="w-full h-full object-contain rounded-sm" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
