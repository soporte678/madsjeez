"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface ProductVariation {
  id: string
  productId: string
  sku: string | null
  attributes: Record<string, string>
  price: number
  comparePrice: number | null
  stock: number
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UseVariationsOptions {
  productId?: string
}

interface UseVariationsReturn {
  variations: ProductVariation[]
  isLoading: boolean
  error: string | null
  refresh: () => void
  createVariation: (data: CreateVariationData) => Promise<void>
  updateVariation: (id: string, data: UpdateVariationData) => Promise<void>
  deleteVariation: (id: string) => Promise<void>
}

interface CreateVariationData {
  productId: string
  sku?: string
  attributes: Record<string, string>
  price: number
  comparePrice?: number
  stock?: number
  images?: string[]
}

interface UpdateVariationData {
  sku?: string
  attributes?: Record<string, string>
  price?: number
  comparePrice?: number
  stock?: number
  images?: string[]
  isActive?: boolean
}

export function useVariations(options: UseVariationsOptions = {}): UseVariationsReturn {
  const { data: session } = useSession()
  const [variations, setVariations] = useState<ProductVariation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVariations = useCallback(async () => {
    if (!options.productId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/variations?productId=${options.productId}`)
      if (!res.ok) throw new Error("Error al cargar variaciones")

      const data = await res.json()
      setVariations(data.variations)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [options.productId])

  useEffect(() => {
    fetchVariations()
  }, [fetchVariations])

  const createVariation = async (data: CreateVariationData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch("/api/variations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al crear variación")
    }

    await fetchVariations()
  }

  const updateVariation = async (id: string, data: UpdateVariationData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/variations/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al actualizar variación")
    }

    await fetchVariations()
  }

  const deleteVariation = async (id: string) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/variations/${id}`, {
      method: "DELETE"
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al eliminar variación")
    }

    await fetchVariations()
  }

  return {
    variations,
    isLoading,
    error,
    refresh: fetchVariations,
    createVariation,
    updateVariation,
    deleteVariation
  }
}
