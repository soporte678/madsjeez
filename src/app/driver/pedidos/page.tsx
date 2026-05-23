"use client"

import { useState, useEffect, useCallback } from "react"
import { FlashQrScanner } from "@/components/flash/FlashQrScanner"
import { DriverShell } from "@/components/driver/DriverShell"
import { useDriverDashboard } from "@/components/driver/useDriverDashboard"
import { DriverShipmentCard } from "@/components/driver/DriverShipmentCard"
import { SectionTitle } from "@/components/driver/driver-ui"
import { FLASH_STATUS_LABELS } from "@/lib/flash/types"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"
import { MapPin, Package, Zap, RefreshCw } from "lucide-react"

const TABS = [
  { id: "available", label: "🟢 Disponibles" },
  { id: "active", label: "Activos" },
  { id: "pickup", label: "Retiro" },
  { id: "transit", label: "En camino" },
  { id: "done", label: "Entregados" },
  { id: "failed", label: "Fallidos" },
] as const

type AvailableShipment = {
  id: string
  status: string
  city: string
  province: string
  street: string
  streetNumber: string
  postalCode: string
  shippingTier: string | null
  shippingPrice: number | null
  priorityScore: number
  updatedAt: string
  order: {
    orderNumber: string
    seller: { storeName: string | null; city: string | null; province: string | null }
  }
}

export default function DriverPedidosPage() {
  const { data, loading, setDutyStatus, reload } = useDriverDashboard()
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("available")
  const [showScanner, setShowScanner] = useState(false)
  const [available, setAvailable] = useState<AvailableShipment[]>([])
  const [availLoading, setAvailLoading] = useState(false)
  const [accepting, setAccepting] = useState<string | null>(null)

  const loadAvailable = useCallback(async () => {
    setAvailLoading(true)
    try {
      const r = await fetch("/api/flash/shipments/available")
      const d = await r.json()
      setAvailable(d.shipments ?? [])
    } finally {
      setAvailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "available") loadAvailable()
  }, [tab, loadAvailable])

  const handleAccept = async (id: string) => {
    setAccepting(id)
    try {
      const r = await fetch(`/api/flash/shipments/${id}/accept`, { method: "POST" })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? "No disponible"); return }
      // Remove from available list and switch to active tab
      setAvailable((prev) => prev.filter((s) => s.id !== id))
      reload?.()
      setTab("active")
    } finally {
      setAccepting(null)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
      </div>
    )
  }

  const all = (data.allShipments ?? data.shipments ?? []) as (FlashShipmentWithRelations & {
    estimatedPay?: number
  })[]

  const filtered = all.filter((s) => {
    if (tab === "active")
      return ["ASSIGNED_TO_DRIVER", "ACCEPTED_BY_DRIVER", "DRIVER_EN_ROUTE_TO_PICKUP", "PACKAGE_PICKED_UP", "IN_TRANSIT", "ARRIVED_AT_ADDRESS", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(s.status)
    if (tab === "pickup") return ["ASSIGNED_TO_DRIVER", "ACCEPTED_BY_DRIVER", "DRIVER_EN_ROUTE_TO_PICKUP", "PACKAGE_READY"].includes(s.status)
    if (tab === "transit") return ["IN_TRANSIT", "ARRIVED_AT_ADDRESS"].includes(s.status)
    if (tab === "done") return s.status === "DELIVERED"
    if (tab === "failed")
      return s.status.startsWith("FAILED") || ["RETURNED_TO_SENDER", "RETURNED_TO_SELLER", "CANCELLED"].includes(s.status)
    return true
  })

  return (
    <DriverShell
      onScan={() => setShowScanner(true)}
      dutyStatus={data.driver.dutyStatus}
      onDutyChange={setDutyStatus}
    >
      {showScanner && <FlashQrScanner onClose={() => setShowScanner(false)} />}

      <SectionTitle title="Gestión de pedidos" subtitle="Paquetes y entregas" />

      <div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              tab === t.id ? "bg-[#facc15] text-black" : "bg-white/10 text-slate-400"
            }`}
          >
            {t.label}
            {t.id === "available" && available.length > 0 && (
              <span className="ml-1 rounded-full bg-emerald-500 px-1.5 text-white text-[10px]">
                {available.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Available shipments feed */}
      {tab === "available" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">Envíos listos para retirar en tu zona</p>
            <button onClick={loadAvailable} className="text-slate-400 hover:text-white">
              <RefreshCw className={`h-4 w-4 ${availLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {availLoading && (
            <div className="py-8 text-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent mx-auto" />
            </div>
          )}
          {!availLoading && available.length === 0 && (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No hay envíos disponibles ahora.</p>
              <p className="text-xs text-slate-600 mt-1">Los vendedores publicarán pedidos en breve.</p>
            </div>
          )}
          {available.map((s) => (
            <div key={s.id} className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-[#facc15] fill-[#facc15] shrink-0" />
                    <span className="text-sm font-bold text-white truncate">
                      #{s.order.orderNumber}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">DISPONIBLE</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>
                      {s.street} {s.streetNumber} — {s.city}, {s.province}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {s.shippingTier && (
                      <span className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                        s.shippingTier === "flash_plus"
                          ? "bg-orange-100 text-orange-700"
                          : s.shippingTier === "flash_local"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                      }`}>
                        {s.shippingTier === "flash_plus" ? "PLUS" : s.shippingTier === "flash_local" ? "LOCAL" : "NORMAL"}
                      </span>
                    )}
                    {s.shippingPrice != null && (
                      <span className="text-sm font-bold text-emerald-400">
                        ${s.shippingPrice.toLocaleString("es-AR")}
                      </span>
                    )}
                    {s.priorityScore >= 100 && (
                      <span className="text-[10px] text-orange-400 font-bold">⚡ PRIORIDAD</span>
                    )}
                  </div>
                  {s.order.seller.storeName && (
                    <p className="text-xs text-slate-500">
                      Retiro en: <span className="text-slate-300">{s.order.seller.storeName}</span>
                      {s.order.seller.city ? `, ${s.order.seller.city}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleAccept(s.id)}
                disabled={accepting === s.id}
                className="mt-3 w-full rounded-xl bg-emerald-500 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60 transition-colors"
              >
                {accepting === s.id ? "Aceptando..." : "✅ Aceptar envío"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* My shipments tabs */}
      {tab !== "available" && (
        <div className="space-y-3">
          {filtered.map((s, i) => (
            <DriverShipmentCard
              key={s.id}
              shipment={s}
              estimatedPay={s.estimatedPay}
              priority={s.status === "ARRIVED_AT_ADDRESS"}
              completed={s.status === "DELIVERED"}
              index={tab === "active" ? i + 1 : undefined}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-slate-500">No hay pedidos en esta categoría.</p>
          )}
        </div>
      )}
    </DriverShell>
  )
}
