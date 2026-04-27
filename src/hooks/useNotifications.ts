"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"

interface Notification {
  id: string
  type: string
  topic: string
  resourceId: string
  title: string
  message: string
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface UseNotificationsReturn {
  notifications: Notification[]
  total: number
  unreadCount: number
  isLoading: boolean
  error: string | null
  refresh: () => void
  markAsRead: (notificationId?: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId?: string) => Promise<void>
}

export function useNotifications(): UseNotificationsReturn {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [total, setTotal] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Error al cargar notificaciones")

      const data = await res.json()
      setNotifications(data.notifications)
      setTotal(data.total)
      setUnreadCount(data.unreadCount)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [session?.user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Polling cada 30 segundos para notificaciones nuevas
  useEffect(() => {
    if (!session?.user) return

    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [session?.user, fetchNotifications])

  const markAsRead = async (notificationId?: string) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId })
    })

    if (!res.ok) throw new Error("Error al marcar como leída")

    await fetchNotifications()
  }

  const markAllAsRead = async () => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true })
    })

    if (!res.ok) throw new Error("Error al marcar todas")

    await fetchNotifications()
  }

  const deleteNotification = async (notificationId?: string) => {
    const url = notificationId 
      ? `/api/notifications?id=${notificationId}`
      : "/api/notifications"

    const res = await fetch(url, { method: "DELETE" })

    if (!res.ok) throw new Error("Error al eliminar")

    await fetchNotifications()
  }

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}
