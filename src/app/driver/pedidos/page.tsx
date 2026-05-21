"use client"

import { useState } from "react"
import { FlashQrScanner } from "@/components/flash/FlashQrScanner"
import { DriverShell } from "@/components/driver/DriverShell"
import { useDriverDashboard } from "@/components/driver/useDriverDashboard"
import { DriverShipmentCard } from "@/components/driver/DriverShipmentCard"
import { SectionTitle } from "@/components/driver/driver-ui"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"

const TABS = [
  { id: "active", label: "Activos" },
  { id: "pickup", label: "Retiro" },
  { id: "transit", label: "En camino" },
  { id: "done", label: "Entregados" },
  { id: "failed", label: "Fallidos" },
] as const

export default function DriverPedidosPage() {
  const { data, loading, setDutyStatus } = useDriverDashboard()
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("active")
  const [showScanner, setShowScanner] = useState(false)

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
      return ["ASSIGNED_TO_DRIVER", "IN_TRANSIT", "ARRIVED_AT_ADDRESS", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(
        s.status
      )
    if (tab === "pickup") return ["ASSIGNED_TO_DRIVER", "PACKAGE_READY"].includes(s.status)
    if (tab === "transit") return ["IN_TRANSIT", "ARRIVED_AT_ADDRESS"].includes(s.status)
    if (tab === "done") return s.status === "DELIVERED"
    if (tab === "failed")
      return s.status.startsWith("FAILED") || s.status === "RETURNED_TO_SENDER" || s.status === "CANCELLED"
    return true
  })

  return (
    <DriverShell
      onScan={() => setShowScanner(true)}
      dutyStatus={data.driver.dutyStatus}
      onDutyChange={setDutyStatus}
    >
      {showScanner && <FlashQrScanner onClose={() => setShowScanner(false)} />}

      <SectionTitle title="Gestión de pedidos" subtitle="Paquetes y entregas asignadas" />

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
          </button>
        ))}
      </div>

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
    </DriverShell>
  )
}
