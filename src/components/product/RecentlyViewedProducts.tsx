"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { loadRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed"

const fmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 })

export function RecentlyViewedProducts({ currentId }: { currentId?: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    const all = loadRecentlyViewed()
    setItems(all.filter((p) => p.id !== currentId).slice(0, 8))
  }, [currentId])

  if (items.length === 0) return null

  return (
    <div className="py-6">
      <h2 className="text-[20px] font-normal text-foreground mb-4">Vistos recientemente</h2>
      <div
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {items.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="min-w-[148px] max-w-[148px] flex-shrink-0 group"
          >
            <div className="h-[120px] border border-border rounded-lg bg-card flex items-center justify-center p-2 mb-2 overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-[1.03] transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full bg-secondary rounded flex items-center justify-center text-muted-foreground/40 text-[11px]">
                  Sin imagen
                </div>
              )}
            </div>
            <p className="text-[12px] text-foreground line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
              {product.title}
            </p>
            <p className="text-[14px] font-medium text-foreground">{fmt.format(product.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
