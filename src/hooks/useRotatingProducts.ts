import { useState, useEffect, useCallback } from "react"

interface Product {
  id: string
  title: string
  price: number
  originalPrice?: number | null
  freeShipping?: boolean
  sales?: number
  image?: string | null
  category?: string
  sellerName?: string
  reputation?: string
}

const CAROUSEL_SIZE = 12 // Show 12 products at a time
const ROTATION_INTERVAL = 60 * 1000 // 60 seconds
const FETCH_INTERVAL = 5 * 60 * 1000 // Refetch every 5 minutes

export function useRotatingProducts() {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [visibleProducts, setVisibleProducts] = useState<Product[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/products/carousel")
      const data = await res.json()
      if (data.products) {
        setAllProducts(data.products)
        setTotalCount(data.total || 0)
        // Initial slice
        setVisibleProducts(data.products.slice(0, CAROUSEL_SIZE))
        setCurrentIndex(0)
      }
    } catch (e) {
      console.error("Failed to fetch carousel products:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Periodic refetch
  useEffect(() => {
    const interval = setInterval(fetchProducts, FETCH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchProducts])

  // Rotation every 60 seconds
  useEffect(() => {
    if (allProducts.length <= CAROUSEL_SIZE) return

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = prev + CAROUSEL_SIZE
        const maxStart = Math.max(0, allProducts.length - CAROUSEL_SIZE)
        const newIndex = next > maxStart ? 0 : next
        setVisibleProducts(allProducts.slice(newIndex, newIndex + CAROUSEL_SIZE))
        return newIndex
      })
    }, ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [allProducts])

  return { products: visibleProducts, allProducts, loading, totalCount }
}
