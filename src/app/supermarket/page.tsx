"use client"

import { Header } from "@/components/Header"
import { ProductCard } from "@/components/product/ProductCard"
import { useEffect, useState } from "react"

interface Product {
  id: string
  title: string
  price: number
  images: { url: string }[]
  seller: { id: string; full_name: string }
  category?: { name: string }
}

export default function SupermarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products?category=supermercado")
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">🛒</span>
          <div>
            <h1 className="text-3xl font-bold">Supermercado</h1>
            <p className="text-gray-600">Todo para tu hogar</p>
          </div>
        </div>

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
            <p className="text-gray-500">No hay productos disponibles en Supermercado</p>
          </div>
        )}
      </main>
    </div>
  )
}
