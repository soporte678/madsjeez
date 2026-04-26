"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface LiveData {
  todayRevenue: number
  todaySales: number
  todayViews: number
  uniqueBuyers: number
  conversionRate: number
  averagePrice: number
}

interface TopProduct {
  id: string
  title: string
  images: string | null
  quantity: number | null
  revenue: number | null
}

interface HourlyData {
  hour: number
  sales_count: number
  total_amount: number
}

interface LiveMonitorData {
  live: LiveData | null
  topProducts: TopProduct[]
  hourlyData: HourlyData[]
  lastUpdated: string | null
  isLoading: boolean
  error: string | null
}

export function useLiveMonitor(): LiveMonitorData & { refresh: () => void } {
  const { status } = useSession()
  
  const [data, setData] = useState<LiveMonitorData>({
    live: null,
    topProducts: [],
    hourlyData: [],
    lastUpdated: null,
    isLoading: true,
    error: null,
  })

  const fetchLiveData = useCallback(async () => {
    if (status !== "authenticated") return

    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      const res = await fetch('/api/dashboard/live')
      if (!res.ok) throw new Error('Error al cargar datos en vivo')
      const liveData = await res.json()

      setData({
        live: liveData.live,
        topProducts: liveData.topProducts || [],
        hourlyData: liveData.hourlyData || [],
        lastUpdated: liveData.lastUpdated,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      console.error("Error fetching live data:", error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }))
    }
  }, [status])

  useEffect(() => {
    fetchLiveData()
  }, [fetchLiveData])

  // Auto-refresh cada 60 segundos
  useEffect(() => {
    if (status !== "authenticated") return
    
    const interval = setInterval(() => {
      fetchLiveData()
    }, 60000)

    return () => clearInterval(interval)
  }, [status, fetchLiveData])

  return {
    ...data,
    refresh: fetchLiveData,
  }
}
