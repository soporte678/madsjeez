"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface DashboardMetrics {
  sales: {
    total: number
    count: number
    today: number
    todayCount: number
  }
  products: {
    total: number
    views: number
  }
  orders: any[]
  claims: {
    open: number
  }
  reviews: {
    pending: number
    average: number
    total: number
  }
  questions: {
    pending: number
  }
  promotions: {
    active: number
  }
  shipping: {
    express: number
  }
}

interface DashboardData {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: string
    isSeller: boolean
    reputationColor: string
    subscriptionTier: string
    totalSales: number
  } | null
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData & { refresh: () => void } {
  const { data: session, status } = useSession()
  
  const [data, setData] = useState<DashboardData>({
    user: null,
    metrics: null,
    isLoading: true,
    error: null,
  })

  const fetchDashboardData = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      const metricsRes = await fetch('/api/dashboard/metrics')
      if (!metricsRes.ok) throw new Error('Error al cargar métricas')
      const metricsData = await metricsRes.json()

      setData({
        user: {
          id: session.user.id,
          name: session.user.name || null,
          email: session.user.email || '',
          image: session.user.image || null,
          role: (session.user as any).role || 'USER',
          isSeller: (session.user as any).isSeller || false,
          reputationColor: (session.user as any).reputationColor || 'VERDE',
          subscriptionTier: (session.user as any).subscriptionTier || 'FREE',
          totalSales: (session.user as any).totalSales || 0,
        },
        metrics: metricsData,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }))
    }
  }, [status, session])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    if (status !== "authenticated") return
    
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 60000)

    return () => clearInterval(interval)
  }, [status, fetchDashboardData])

  return {
    ...data,
    refresh: fetchDashboardData,
  }
}
