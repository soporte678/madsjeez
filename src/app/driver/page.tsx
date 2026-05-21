"use client"

import { useState } from "react"
import {
  TrendingUp,
  Wallet,
  Star,
  Route,
  Package,
  Clock,
  MapPin,
  Bell,
  ChevronRight,
  QrCode,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { FlashQrScanner } from "@/components/flash/FlashQrScanner"
import { DriverShell } from "@/components/driver/DriverShell"
import { useDriverDashboard } from "@/components/driver/useDriverDashboard"
import { DriverCard, formatMoney, MetricPill, SectionTitle } from "@/components/driver/driver-ui"
import { DriverShipmentCard } from "@/components/driver/DriverShipmentCard"
import { TIER_LABELS } from "@/lib/flash/driver-constants"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"
import Link from "next/link"

export default function DriverDashboardPage() {
  const { data, loading, error, reload, setDutyStatus, setWorkMode } = useDriverDashboard()
  const [showScanner, setShowScanner] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#0b0f14] px-6 text-center">
        <p className="text-red-400">{error || "Sin datos"}</p>
        <button type="button" onClick={reload} className="text-[#facc15] font-bold">
          Reintentar
        </button>
      </div>
    )
  }

  const shipments = (data.shipments ?? []) as (FlashShipmentWithRelations & {
    estimatedPay?: number
  })[]
  const inProgress = shipments.filter((s) => s.status === "ARRIVED_AT_ADDRESS")
  const pending = shipments.filter((s) =>
    ["ASSIGNED_TO_DRIVER", "IN_TRANSIT", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(s.status)
  )

  const connectedH = Math.floor(data.driver.connectedMinutes / 60)
  const connectedM = data.driver.connectedMinutes % 60

  return (
    <DriverShell
      onScan={() => setShowScanner(true)}
      dutyStatus={data.driver.dutyStatus}
      onDutyChange={setDutyStatus}
    >
      {showScanner && <FlashQrScanner onClose={() => setShowScanner(false)} />}

      {/* Alerta: MercadoPago no vinculado */}
      {data.driver.mercadoPagoLinked === false && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-white">
              Para recibir pagos de envíos Flash, vinculá tu billetera de MercadoPago.
            </p>
            {data.driver.mercadoPagoStatus === "pending" && (
              <p className="text-xs text-amber-300 mt-1">Vinculación en proceso — aguardá la confirmación.</p>
            )}
            {data.driver.mercadoPagoStatus === "error" && (
              <p className="text-xs text-red-400 mt-1">Error en la vinculación. Intentá de nuevo.</p>
            )}
            <Link
              href="/driver/perfil?vincular-mp=1"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-black hover:bg-amber-300 transition-colors"
            >
              Vincular MercadoPago
            </Link>
          </div>
        </div>
      )}

      {/* Ganancias destacadas */}
      <DriverCard accent="green" className="mb-4 bg-gradient-to-br from-emerald-950/80 to-[#121820]">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/80">Ganaste hoy</p>
        <p className="mt-1 text-3xl font-black text-white">{formatMoney(data.summary.earnedToday)}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MetricPill label="Semana" value={formatMoney(data.summary.earnedWeek)} />
          <MetricPill label="Próximo cobro" value={formatMoney(data.summary.nextPayoutEstimate)} />
        </div>
        <Link
          href="/driver/ganancias"
          className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-emerald-400"
        >
          Ver billetera y comisiones <ChevronRight className="h-3 w-3" />
        </Link>
      </DriverCard>

      {/* Métricas rápidas */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <DriverCard className="!p-3">
          <Package className="mb-1 h-4 w-4 text-sky-400" />
          <p className="text-xl font-black">{data.summary.pendingCount}</p>
          <p className="text-[10px] text-slate-500">Pedidos activos</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <TrendingUp className="mb-1 h-4 w-4 text-emerald-400" />
          <p className="text-xl font-black">{data.summary.deliveredToday}</p>
          <p className="text-[10px] text-slate-500">Entregados hoy</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <Route className="mb-1 h-4 w-4 text-amber-400" />
          <p className="text-xl font-black">{data.driver.totalKm.toFixed(0)} km</p>
          <p className="text-[10px] text-slate-500">Distancia</p>
        </DriverCard>
        <DriverCard className="!p-3">
          <Clock className="mb-1 h-4 w-4 text-slate-400" />
          <p className="text-xl font-black">
            {connectedH}h {connectedM}m
          </p>
          <p className="text-[10px] text-slate-500">Conectado</p>
        </DriverCard>
      </div>

      {/* Ranking */}
      <DriverCard className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Nivel {TIER_LABELS[data.driver.tier as keyof typeof TIER_LABELS] ?? data.driver.tier}
            </p>
            <p className="text-xs text-slate-500">
              {data.driver.rating.toFixed(1)} ★ · {data.performance.successRate}% éxito
            </p>
          </div>
        </div>
        <Link href="/driver/mas" className="text-xs font-bold text-[#facc15]">
          Ver más
        </Link>
      </DriverCard>

      {/* Modo híbrido */}
      <SectionTitle title="Modo de trabajo" subtitle="Flex + pedidos en vivo" />
      <div className="mb-4 flex gap-2">
        {(
          [
            { id: "hybrid", label: "Híbrido" },
            { id: "blocks", label: "Bloques" },
            { id: "on_demand", label: "Pedidos" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setWorkMode(m.id)}
            className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-colors ${
              data.driver.workMode === m.id
                ? "border-[#facc15] bg-[#facc15]/15 text-[#facc15]"
                : "border-white/10 text-slate-500"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Bloques Flex */}
      {data.blocks && (data.blocks as unknown[]).length > 0 && (
        <section className="mb-5">
          <SectionTitle title="Bloques Flex disponibles" subtitle="Pago garantizado por horario" />
          <div className="space-y-2">
            {(data.blocks as { id: string; zone: string; guaranteedPay: number; estimatedPackages: number; startsAt: string }[]).slice(0, 3).map((b) => (
              <DriverCard key={b.id} accent="blue" className="!p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-white">{b.zone}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(b.startsAt).toLocaleString("es-AR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}
                      {b.estimatedPackages} paq.
                    </p>
                  </div>
                  <p className="text-sm font-black text-emerald-400">{formatMoney(b.guaranteedPay)}</p>
                </div>
              </DriverCard>
            ))}
          </div>
        </section>
      )}

      {/* Notificaciones */}
      {data.notifications.length > 0 && (
        <section className="mb-5">
          <SectionTitle title="Alertas" />
          {data.notifications.map((n) => (
            <div
              key={n.id}
              className="mb-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
            >
              <Bell className="h-3.5 w-3.5 shrink-0" />
              {n.title}
            </div>
          ))}
        </section>
      )}

      <button
        type="button"
        onClick={() => setShowScanner(true)}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-[#facc15]/30 bg-[#facc15]/10 p-4"
      >
        <QrCode className="h-8 w-8 text-[#facc15]" />
        <div className="text-left">
          <p className="font-bold text-white">Escanear paquete</p>
          <p className="text-xs text-slate-400">Retiro o entrega con QR</p>
        </div>
      </button>

      <div className="mb-3 flex items-center justify-between">
        <SectionTitle title="Pedidos activos" subtitle={`${pending.length + inProgress.length} en curso`} />
        <button type="button" onClick={reload} className="text-slate-500">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {inProgress.map((s, i) => (
          <DriverShipmentCard key={s.id} shipment={s} priority estimatedPay={s.estimatedPay} index={i + 1} />
        ))}
        {pending.map((s, i) => (
          <DriverShipmentCard
            key={s.id}
            shipment={s}
            estimatedPay={s.estimatedPay}
            index={inProgress.length + i + 1}
          />
        ))}
        {shipments.length === 0 && (
          <DriverCard className="py-12 text-center">
            <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-600" />
            <p className="font-bold text-white">Sin pedidos asignados</p>
            <p className="mt-1 text-sm text-slate-500">Activá disponible para recibir bloques o pedidos.</p>
            <Link href="/driver/pedidos" className="mt-4 inline-block text-sm font-bold text-[#facc15]">
              Ver todos los pedidos
            </Link>
          </DriverCard>
        )}
      </div>
    </DriverShell>
  )
}
