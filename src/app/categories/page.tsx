"use client"

import Link from "next/link"
import { Header } from "@/components/Header"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  product_count: number
  children_count: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories")
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        }
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Categorías</h1>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-32 animate-pulse bg-gray-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`}>
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#3483FA] rounded-lg flex items-center justify-center text-white text-2xl">
                        {category.icon || "📦"}
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{category.name}</h2>
                        <p className="text-gray-500 text-sm">
                          {category.product_count} productos
                        </p>
                        {category.children_count > 0 && (
                          <p className="text-gray-400 text-xs mt-1">
                            {category.children_count} subcategorías
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
        
        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay categorías disponibles</p>
          </div>
        )}
      </main>
    </div>
  )
}
