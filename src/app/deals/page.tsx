"use client"

import { Header } from "@/components/Header"
import { ProductCard } from "@/components/product/ProductCard"
import { useEffect, useState } from "react"

interface Product {
  id: string
  title: string
  price: number
  original_price?: number
  images: { url: string }[]
  seller: { id: string; full_name: string }
}

export default function DealsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeals() {
      try {
        const response = await fetch("/api/products?deals=true")
        if (response.ok) {
          const data = await response.json()
          const list = Array.isArray(data) ? data : data.products ?? []
          setProducts(
            list.filter(
              (p: Product) =>
                Boolean(p.original_price) &&
                p.price < (p.original_price as number) &&
                Boolean(p.images?.[0]?.url?.trim())
            )
          )
        }
      } catch (error) {
        console.error("Error fetching deals:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDeals()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Ofertas</h1>
        <p className="text-gray-600 mb-8">Los mejores descuentos del día</p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay ofertas disponibles en este momento</p>
          </div>
        )}
      </main>
    </div>
  )
}
