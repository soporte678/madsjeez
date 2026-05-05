"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface Question {
  id: string
  productId: string
  buyerId: string
  question: string
  answer: string | null
  answeredAt: string | null
  images: string[] // URLs de imágenes adjuntas
  status: "pending" | "answered"
  isPublic: boolean
  createdAt: string
  updatedAt: string
  buyer: {
    id: string
    name: string | null
    image: string | null
  }
  product: {
    id: string
    title: string
    images: string | null
    seller?: {
      id: string
      name: string | null
    }
  }
  isBuyer?: boolean
  isSeller?: boolean
}

interface UseQuestionsOptions {
  productId?: string
  sellerId?: string
  status?: "pending" | "answered" | "all"
  page?: number
  limit?: number
}

interface UseQuestionsReturn {
  questions: Question[]
  total: number
  page: number
  totalPages: number
  isLoading: boolean
  error: string | null
  refresh: () => void
  askQuestion: (productId: string, question: string) => Promise<void>
  answerQuestion: (questionId: string, answer: string) => Promise<void>
  deleteQuestion: (questionId: string) => Promise<void>
}

export function useQuestions(options: UseQuestionsOptions = {}): UseQuestionsReturn {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(options.page || 1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (options.productId) params.append("productId", options.productId)
      if (options.sellerId) params.append("sellerId", options.sellerId)
      if (options.status) params.append("status", options.status)
      params.append("page", page.toString())
      params.append("limit", (options.limit || 20).toString())

      const res = await fetch(`/api/questions?${params}`)
      if (!res.ok) throw new Error("Error al cargar preguntas")

      const data = await res.json()
      setQuestions(data.questions)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [options.productId, options.sellerId, options.status, page, options.limit])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const askQuestion = async (productId: string, question: string, images: string[] = []) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, question, images })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al enviar pregunta")
    }

    // Refresh list
    await fetchQuestions()
  }

  const answerQuestion = async (questionId: string, answer: string) => {
    if (!session?.user) {
      throw new Error("Debes iniciar sesión")
    }

    const res = await fetch(`/api/questions/${questionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer })
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al responder")
    }

    // Refresh list
    await fetchQuestions()
  }

  const deleteQuestion = async (questionId: string) => {
    const res = await fetch(`/api/questions/${questionId}`, {
      method: "DELETE"
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Error al eliminar")
    }

    // Refresh list
    await fetchQuestions()
  }

  return {
    questions,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refresh: fetchQuestions,
    askQuestion,
    answerQuestion,
    deleteQuestion
  }
}
