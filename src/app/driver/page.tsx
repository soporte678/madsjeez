"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import { FlashQrScanner } from "@/components/flash/FlashQrScanner"
import { DriverShell } from "@/components/driver/DriverShell"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Phone,
  Navigation,
  QrCode,
  Package,
  Clock,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  Route,
  Inbox,
} from "lucide-react"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"

export default function DriverDashboardPage() {
  const { status } = useSession()
  const [shipments, setShipments] = useState<FlashShipmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const r = await fetch("/api/flash/shipments?role=driver", { cache: "no-store" })
      const d = await r.json()
      setShipments(d.shipments ?? [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status, load])

  const pending = shipments.filter((s) =>
    ["ASSIGNED_TO_DRIVER", "IN_TRANSIT", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(s.status)
  )
  const inProgress = shipments.filter((s) => s.status === "ARRIVED_AT_ADDRESS")
  const done = shipments.filter((s) =>
    ["DELIVERED", "FAILED_ATTEMPT_1", "FAILED_ATTEMPT_2", "FAILED_ATTEMPT_3"].includes(s.status)
  )
  const activeCount = pending.length + inProgress.length

  const deliveredToday = shipments.filter((s) => {
    if (s.status !== "DELIVERED") return false
    return new Date(s.updatedAt).toDateString() === new Date().toDateString()
  }).length

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0b0f14]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#facc15] border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">Cargando rutas...</p>
      </div>
    )
  }

  return (
    <DriverShell onScan={() => setShowScanner(true)}>
      {showScanner && <FlashQrScanner onClose={() => setShowScanner(false)} />}

      {/* Resumen del día */}
      <section className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Tu jornada</h2>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard
            label="En ruta"
            value={activeCount}
            icon={<Route className="h-4 w-4" />}
            accent="amber"
          />
          <StatCard
            label="Asignados"
            value={shipments.length}
            icon={<Package className="h-4 w-4" />}
            accent="sky"
          />
          <StatCard
            label="Entregados"
            value={deliveredToday}
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="emerald"
          />
        </div>
      </section>

      {/* CTA secundario */}
      <button
        type="button"
        onClick={() => setShowScanner(true)}
        className="mb-6 flex w-full items-center justify-between rounded-2xl border border-[#facc15]/30 bg-gradient-to-r from-[#facc15]/15 to-[#f97316]/10 px-4 py-3.5 text-left transition-colors active:bg-[#facc15]/20"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#facc15] text-black">
            <QrCode className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Escanear paquete</p>
            <p className="text-xs text-slate-400">Confirmá retiro o entrega con QR</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-500" />
      </button>

      <div id="pedidos" className="scroll-mt-4 space-y-6">
        {inProgress.length > 0 && (
          <OrderSection
            title="En el domicilio"
            subtitle="Prioridad alta"
            icon={<Clock className="h-4 w-4 text-amber-400" />}
            count={inProgress.length}
          >
            {inProgress.map((s, i) => (
              <DriverShipmentCard key={s.id} shipment={s} priority index={i + 1} />
            ))}
          </OrderSection>
        )}

        {pending.length > 0 && (
          <OrderSection
            title="Próximas entregas"
            subtitle="Orden sugerido de ruta"
            icon={<MapPin className="h-4 w-4 text-sky-400" />}
            count={pending.length}
          >
            {pending.map((s, i) => (
              <DriverShipmentCard key={s.id} shipment={s} index={inProgress.length + i + 1} />
            ))}
          </OrderSection>
        )}

        {done.length > 0 && (
          <OrderSection
            title="Finalizados"
            subtitle="Hoy y recientes"
            icon={<CheckCircle2 className="h-4 w-4 text-slate-500" />}
            count={done.length}
            muted
          >
            {done.map((s) => (
              <DriverShipmentCard key={s.id} shipment={s} completed />
            ))}
          </OrderSection>
        )}

        {shipments.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#121820] px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Inbox className="h-8 w-8 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-white">Sin pedidos por ahora</h3>
            <p className="mx-auto mt-2 max-w-[260px] text-sm leading-relaxed text-slate-400">
              Cuando el equipo te asigne envíos, aparecerán acá con dirección, mapa y contacto del cliente.
            </p>
            <Button
              type="button"
              className="mt-6 bg-[#facc15] font-bold text-black hover:bg-[#fde047]"
              onClick={() => load(true)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Buscar nuevos pedidos
            </Button>
          </div>
        )}
      </div>
    </DriverShell>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: "amber" | "sky" | "emerald"
}) {
  const iconColor = {
    amber: "text-amber-400",
    sky: "text-sky-400",
    emerald: "text-emerald-400",
  }[accent]

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#121820] p-3.5">
      <div className={`mb-2 inline-flex rounded-lg bg-white/5 p-1.5 ${iconColor}`}>{icon}</div>
      <p className="text-2xl font-black tabular-nums text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

function OrderSection({
  title,
  subtitle,
  icon,
  count,
  muted,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  count: number
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className={`text-sm font-bold ${muted ? "text-slate-500" : "text-white"}`}>{title}</h2>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-300">
          {count}
        </span>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function DriverShipmentCard({
  shipment,
  priority,
  completed,
  index,
}: {
  shipment: FlashShipmentWithRelations
  priority?: boolean
  completed?: boolean
  index?: number
}) {
  const addr = `${shipment.street} ${shipment.streetNumber}, ${shipment.city}, ${shipment.province}`
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`
  const waPhone = shipment.recipientPhone.replace(/\D/g, "")

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-[#121820] shadow-lg transition-all ${
        priority
          ? "border-amber-500/50 ring-1 ring-amber-500/30"
          : completed
            ? "border-white/5 opacity-75"
            : "border-white/[0.08] hover:border-white/15"
      }`}
    >
      {priority && (
        <div className="bg-gradient-to-r from-amber-500/90 to-orange-500/90 px-4 py-1.5 text-center text-[10px] font-black uppercase tracking-widest text-black">
          Entrega en curso
        </div>
      )}

      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          {index != null && !completed && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-[#facc15]">
              {index}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-bold text-white">{shipment.recipientName}</h3>
              <FlashStatusBadge status={shipment.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Pedido #{shipment.order?.orderNumber ?? "—"} · {shipment.city}
            </p>
          </div>
          {shipment.attempts.length > 0 && (
            <span className="shrink-0 rounded-lg bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-400">
              {shipment.attempts.length}/3
            </span>
          )}
        </div>

        <div className="mb-4 space-y-2 rounded-xl bg-black/25 p-3">
          <p className="flex items-start gap-2 text-sm leading-snug text-slate-200">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            <span>
              {shipment.street} {shipment.streetNumber}
              {shipment.apartment ? `, ${shipment.apartment}` : ""}
              <span className="block text-xs text-slate-500">
                {shipment.city}, {shipment.province}
              </span>
            </span>
          </p>
          {(shipment.betweenStreet1 || shipment.betweenStreet2) && (
            <p className="pl-6 text-xs text-slate-500">
              Entre {shipment.betweenStreet1} y {shipment.betweenStreet2}
            </p>
          )}
          <a
            href={`https://wa.me/${waPhone}`}
            className="flex items-center gap-2 text-sm font-medium text-emerald-400"
          >
            <Phone className="h-4 w-4" />
            {shipment.recipientPhone}
          </a>
        </div>

        {!completed && (
          <div className="grid grid-cols-2 gap-2">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="block">
              <Button
                size="sm"
                className="h-11 w-full rounded-xl bg-sky-600 text-sm font-bold text-white hover:bg-sky-500"
              >
                <Navigation className="mr-1.5 h-4 w-4" />
                Navegar
              </Button>
            </a>
            <a href={`/flash/scan/${shipment.qrToken}`} className="block">
              <Button
                size="sm"
                className="h-11 w-full rounded-xl bg-[#facc15] text-sm font-bold text-black hover:bg-[#fde047]"
              >
                <QrCode className="mr-1.5 h-4 w-4" />
                Entregar
              </Button>
            </a>
          </div>
        )}
      </div>
    </article>
  )
}
