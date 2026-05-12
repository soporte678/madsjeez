"use client"

import { useState, useEffect } from "react"
import { X, Zap } from "lucide-react"

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

  useEffect(() => {
    if (sessionStorage.getItem("madsjeez_notifs_loaded")) return

    const load = async () => {
      try {
        const res = await fetch("/api/ai/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "generate" }),
        })
        if (!res.ok) {
          // 429 u otros: no marcar sesión para permitir reintento en la próxima visita
          return
        }
        const data = (await res.json()) as { notifications?: SmartNotification[] }
        sessionStorage.setItem("madsjeez_notifs_loaded", "1")
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications)
          // Show after 5 seconds
          setTimeout(() => setShow(true), 5000)
        }
      } catch (e) {
        console.error(e)
      }
    }

    void load()
  }, [])

  const dismiss = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index))
    if (notifications.length <= 1) setShow(false)
  }

  if (!show || notifications.length === 0) return null

  const urgencyColors: Record<"high" | "medium" | "low", string> = {
    high: "border-l-red-500 bg-red-50",
    medium: "border-l-orange-500 bg-orange-50",
    low: "border-l-blue-500 bg-blue-50",
  }

  const urgencyClass = (raw?: string) => {
    const k = raw === "high" || raw === "medium" || raw === "low" ? raw : "low"
    return urgencyColors[k]
  }

  return (
    <div className="fixed top-20 right-4 z-40 w-80 space-y-2 animate-in slide-in-from-right-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Zap size={14} className="text-yellow-500" /> Novedades para vos
        </div>
        <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600">
          <X size={16} />
        </button>
      </div>

      {notifications.slice(0, 4).map((n, i) => (
        <div
          key={i}
          className={`bg-white rounded-lg shadow-lg border-l-4 p-3 flex items-start gap-3 cursor-pointer hover:shadow-xl transition-all ${urgencyClass(n.urgency)}`}
          onClick={() => {
            if (n.product_slug) window.location.href = `/product/${n.product_slug}`
            dismiss(i)
          }}
        >
          <span className="text-lg shrink-0">{n.emoji || "🔔"}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-800 line-clamp-1">{n.title}</p>
            <p className="text-[11px] text-slate-500 line-clamp-2">{n.message}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); dismiss(i) }} className="text-slate-300 hover:text-slate-500 shrink-0">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
