"use client"
import { useState, useEffect } from "react"
import { Loader2, ImageOff } from "lucide-react"

interface Props {
  paths: string[]   // paths de Supabase Storage
  className?: string
}

export function FlashPhotoGallery({ paths, className }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (paths.length === 0) return
    setLoading(true)
    fetch("/api/flash/photos/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    })
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {}
        for (const item of d.urls ?? []) {
          if (item.url) map[item.path] = item.url
        }
        setUrls(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [paths.join(",")])

  if (paths.length === 0) return null

  if (loading) return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      {paths.map((_, i) => (
        <div key={i} className="w-16 h-16 rounded border bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        </div>
      ))}
    </div>
  )

  return (
    <>
      <div className={`flex gap-2 flex-wrap ${className ?? ""}`}>
        {paths.map((path, i) => {
          const url = urls[path]
          if (!url) return (
            <div key={i} className="w-16 h-16 rounded border bg-gray-100 flex items-center justify-center">
              <ImageOff className="h-4 w-4 text-gray-400" />
            </div>
          )
          return (
            <button key={i} onClick={() => setExpanded(url)}>
              <img
                src={url}
                alt={`Evidencia ${i + 1}`}
                className="w-16 h-16 object-cover rounded border hover:opacity-80 transition-opacity"
              />
            </button>
          )
        })}
      </div>

      {/* Lightbox */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpanded(null)}
        >
          <img
            src={expanded}
            alt="Evidencia ampliada"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl font-bold"
            onClick={() => setExpanded(null)}
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
