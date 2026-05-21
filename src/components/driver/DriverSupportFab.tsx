"use client"

import { useState } from "react"
import { Headphones, X, Send, Loader2 } from "lucide-react"
import { FLASH_SUPPORT_CATEGORIES } from "@/lib/flash/driver-constants"

export function DriverSupportFab() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState("")

  const submit = async () => {
    if (!category) return
    setSending(true)
    setDone("")
    try {
      const r = await fetch("/api/flash/drivers/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ category, message }),
      })
      const d = await r.json()
      if (!r.ok) {
        setDone(d.error ?? "Error")
        return
      }
      setDone(d.message ?? "Enviado")
      setCategory("")
      setMessage("")
      setTimeout(() => setOpen(false), 1500)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 z-[60] flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-900/40 transition-transform active:scale-95"
        style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
      >
        <Headphones className="h-4 w-4" />
        Solicitar soporte
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#121820] shadow-2xl"
            role="dialog"
            aria-labelledby="support-title"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 id="support-title" className="text-base font-bold text-white">
                Solicitar contacto con soporte
              </h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {FLASH_SUPPORT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    category === c.id
                      ? "border-red-500/50 bg-red-500/15 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                  }`}
                >
                  {c.urgent && <span className="mr-1 text-red-400">● </span>}
                  {c.label}
                </button>
              ))}
              <textarea
                placeholder="Detalle opcional..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b0f14] px-3 py-2 text-sm text-white placeholder:text-slate-500"
                rows={3}
              />
              {done && <p className="text-center text-sm text-emerald-400">{done}</p>}
            </div>
            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                disabled={!category || sending}
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
