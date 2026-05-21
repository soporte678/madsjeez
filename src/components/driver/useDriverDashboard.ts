"use client"

import { useCallback, useEffect, useState } from "react"
import type { FlashDriverDutyStatus } from "@prisma/client"

export type DriverDashboardData = {
  driver: {
    id: string
    name: string | null
    email: string
    dutyStatus: FlashDriverDutyStatus
    workMode: string
    rating: number
    tier: string
    acceptanceRate: number
    connectedMinutes: number
    totalKm: number
  }
  summary: {
    earnedToday: number
    earnedWeek: number
    earnedMonth: number
    commissionToday: number
    tipsToday?: number
    deliveredToday: number
    pendingCount: number
    nextPayoutEstimate: number
    nextPayoutStatus: string
  }
  earnings?: {
    id: string
    description: string
    netAmount: number
    status: string
    createdAt: string
  }[]
  wallet: { available: number; pending: number; processing: number }
  performance: {
    acceptanceRate: number
    successRate: number
    avgDeliveryMin: number
    rating: number
    tier: string
  }
  shipments: unknown[]
  allShipments: unknown[]
  blocks: unknown[]
  notifications: { id: string; type: string; title: string; read: boolean }[]
  rates: Record<string, number>
}

export function useDriverDashboard() {
  const [data, setData] = useState<DriverDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setError("")
    try {
      const r = await fetch("/api/flash/drivers/dashboard", { cache: "no-store", credentials: "include" })
      const json = await r.json()
      if (!r.ok) {
        setError(json.error ?? "Error al cargar")
        return
      }
      setData(json)
    } catch {
      setError("Sin conexión")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const setDutyStatus = async (dutyStatus: FlashDriverDutyStatus) => {
    const r = await fetch("/api/flash/drivers/me/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ dutyStatus }),
    })
    if (r.ok) await load()
  }

  const setWorkMode = async (workMode: string) => {
    const r = await fetch("/api/flash/drivers/me/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ workMode }),
    })
    if (r.ok) await load()
  }

  return { data, loading, error, reload: load, setDutyStatus, setWorkMode }
}
