"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

export type ClaimType = "CLAIM" | "RETURN" | "EXCHANGE"
export type ClaimStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED" | "CANCELLED"

export interface Claim {
  id: string
  orderId: string
  buyerId: string
  sellerId: string
  type: ClaimType
  reason: string
  description: string
  status: ClaimStatus
  images: string[]
  resolution: string | null
  resolutionNotes: string | null
  refundAmount: number | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  buyer: {
    id: string
    name: string | null
    image: string | null
  }
  seller: {
    id: string
    name: string | null
    image: string | null
  }
  order: {
    id: string
    orderNumber: string
    total: number
    items: any[]
  }
  claimMessages?: ClaimMessage[]
  _count?: {
    claimMessages: number
  }
}

export interface ClaimMessage {
  id: string
  claimId: string
  senderId: string
  content: string
  attachments: string[]
  isInternal: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    image: string | null
  }
}

interface UseClaimsOptions {
  asBuyer?: boolean
  status?: ClaimStatus
  page?: number
  limit?: number
}

interface UseClaimsReturn {
  claims: Claim[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  refresh: () => void
  getClaim: (id: string) => Promise<Claim | null>
  createClaim: (data: CreateClaimData) => Promise<void>
  resolveClaim: (id: string, data: ResolveClaimData) => Promise<void>
  sendMessage: (claimId: string, content: string, attachments?: string[]) => Promise<void>
}

interface CreateClaimData {
  orderId: string
  type: ClaimType
  reason: string
  description: string
  images?: string[]
}

interface ResolveClaimData {
  status: ClaimStatus
  resolution: string
  resolutionNotes?: string
  refundAmount?: number
}

export function useClaims(options: UseClaimsOptions = {}): UseClaimsReturn {
  const { data: session } = useSession()
  const [claims, setClaims] = useState<Claim[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(options.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClaims = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("asBuyer", options.asBuyer ? "true" : "false")
      if (options.status) params.append("status", options.status)
      params.append("page", page.toString())
      params.append("limit", (options.limit || 20).toString())

      const res = await fetch(`/api/claims?${params}`)
      if (!res.ok) throw new Error("Error al cargar reclamos")

      const data = await res.json()
      setClaims(data.claims)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user, options.asBuyer, options.status, page, options.limit])

  useEffect(() => {
    fetchClaims()
  }, [fetchClaims])

  const getClaim = async (id: string): Promise<Claim | null> => {
    try {
      const res = await fetch(`/api/claims/${id}`)
      if (!res.ok) throw new Error("Error al obtener reclamo")
      return await res.json()
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }

  const createClaim = async (data: CreateClaimData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al crear reclamo")
    }

    await fetchClaims()
  }

  const resolveClaim = async (id: string, data: ResolveClaimData) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/claims/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al resolver reclamo")
    }

    await fetchClaims()
  }

  const sendMessage = async (claimId: string, content: string, attachments?: string[]) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/claims/${claimId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, attachments })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al enviar mensaje")
    }
  }

  return {
    claims,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refresh: fetchClaims,
    getClaim,
    createClaim,
    resolveClaim,
    sendMessage
  }
}
