"use client"

import { useState, useEffect, useRef } from "react"
import { Sparkles, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function AIRecommendations() {
  const [products, setProducts] = useState<any[]>([])
  const [sectionTitle, setSectionTitle] = useState("Recomendados para vos")
  const [loaded, setLoaded] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        observer.disconnect()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 6000)

        const load = async () => {
          try {
            const viewedRaw = localStorage.getItem("madsjeez_viewed") || "[]"
            const searchRaw = localStorage.getItem("madsjeez_searches") || "[]"
            const viewedProducts = JSON.parse(viewedRaw).slice(0, 5)
            const searchHistory = JSON.parse(searchRaw).slice(0, 5)

            const res = await fetch("/api/ai/recommendations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ viewedProducts, searchHistory }),
              signal: controller.signal,
            })
            const data = await res.json()
            if (data.products && data.products.length > 0) {
              setProducts(data.products)
              setSectionTitle(data.section_title || "Recomendados para vos")
            }
          } catch {
            // silencioso — la seccion simplemente no se muestra
          } finally {
            clearTimeout(timeoutId)
            setLoaded(true)
          }
        }

        load()
      },
      { rootMargin: "200px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const fmt = (v: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(v)

  return (
    <section ref={sectionRef} className="py-8" aria-live="polite">
      {(!loaded || products.length === 0) ? null : (<>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-purple-600" size={20} />
          <h2 className="text-xl font-semibold text-slate-800">{sectionTitle}</h2>
        </div>
        <Link href="/search" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
          Ver más <ChevronRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 8).map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug || p.id}`}
            className="bg-white rounded-xl border border-slate-200 hover:shadow-lg transition-all overflow-hidden group"
          >
            <div className="aspect-square bg-slate-50 flex items-center justify-center p-4 overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              ) : (
                <div className="w-full h-full bg-slate-100 rounded flex items-center justify-center text-slate-300 text-sm">Sin imagen</div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm text-slate-700 line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{p.title}</p>
              <p className="text-lg font-bold text-slate-900">{fmt(p.price)}</p>
              {p.original_price && p.original_price > p.price && (
                <p className="text-xs text-slate-400 line-through">{fmt(p.original_price)}</p>
              )}
              {p.shipping_free && <p className="text-xs text-green-600 font-medium mt-1">Envío gratis</p>}
              {p.reason && <p className="text-[10px] text-purple-500 mt-1 italic">{p.reason}</p>}
            </div>
          </Link>
        ))}
      </div>
      </>)}
    </section>
  )
}
