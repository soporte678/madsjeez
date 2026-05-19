"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { X, Zap } from "lucide-react"
import {
  NOVEDADES_PANEL_OPEN_EVENT,
  markNovedadesPanelSeen,
} from "@/lib/novedades-panel"

type SmartNotification = {
  title?: string
  message?: string
  emoji?: string
  urgency?: string
  product_slug?: string | null
}

export default function AISmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([])
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)

  const closePanel = useCallback(() => {
    setShow(false)
    markNovedadesPanelSeen()
  }, [])

  const loadNotifications = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await fetch("/api/ai/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      if (!res.ok) return
      const data = (await res.json()) as { notifications?: SmartNotification[] }
      if (data.notifications?.length) {
        setNotifications(data.notifications)
        setShow(true)
      } else {
        closePanel()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [closePanel])

  useEffect(() => {
    const onOpen = () => {
      void loadNotifications()
    }
    window.addEventListener(NOVEDADES_PANEL_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(NOVEDADES_PANEL_OPEN_EVENT, onOpen)
  }, [loadNotifications])

  const dismiss = (index: number) => {
    setNotifications((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) closePanel()
      return next
    })
  }

  if (!show && !loading) return null

  const urgencyColors: Record<"high" | "medium" | "low", string> = {
    high: "border-l-amber-500 bg-amber-50",
    medium: "border-l-orange-500 bg-orange-50",
    low: "border-l-blue-500 bg-blue-50",
  }

  const urgencyClass = (raw?: string) => {
    const k = raw === "high" || raw === "medium" || raw === "low" ? raw : "low"
    return urgencyColors[k]
  }

  return (
    <div className="fixed top-20 right-4 z-[45] w-80 space-y-2 animate-in slide-in-from-right-4">
      {loading ? (
        <div className="rounded-lg border border-white/10 bg-card/95 p-4 shadow-lg backdrop-blur-md">
          <p className="text-sm text-muted-foreground">Cargando novedades…</p>
        </div>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Zap size={14} className="text-yellow-500" /> Novedades para vos
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label="Cerrar panel de novedades"
            >
              <X size={16} />
            </button>
          </div>

          {notifications.slice(0, 4).map((n, i) => (
            <div
              key={i}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-l-4 bg-white p-3 shadow-lg transition-all hover:shadow-xl ${urgencyClass(n.urgency)}`}
              onClick={() => {
                if (n.product_slug) window.location.href = `/product/${n.product_slug}`
                dismiss(i)
              }}
            >
              <span className="shrink-0 text-lg">{n.emoji || "🔔"}</span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-slate-800">{n.title}</p>
                <p className="line-clamp-2 text-[11px] text-slate-500">{n.message}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  dismiss(i)
                }}
                className="shrink-0 text-slate-300 hover:text-slate-500"
                aria-label="Cerrar novedad"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
