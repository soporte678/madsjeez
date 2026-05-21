"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import { FlashQrScanner } from "@/components/flash/FlashQrScanner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Zap, Package, MapPin, Phone, Navigation,
  QrCode, CheckCircle2, RefreshCw, Clock,
} from "lucide-react"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"

export default function DriverDashboardPage() {
  const { data: session, status } = useSession()
  const [shipments, setShipments] = useState<FlashShipmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [today] = useState(() => new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }))

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/flash/shipments?role=driver")
      const d = await r.json()
      setShipments(d.shipments ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500 text-sm">Cargando tus pedidos...</p>
        </div>
      </div>
    )
  }

  const pending = shipments.filter((s) =>
    ["ASSIGNED_TO_DRIVER", "IN_TRANSIT", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(s.status)
  )
  const inProgress = shipments.filter((s) => s.status === "ARRIVED_AT_ADDRESS")
  const done = shipments.filter((s) => ["DELIVERED", "FAILED_ATTEMPT_1", "FAILED_ATTEMPT_2", "FAILED_ATTEMPT_3"].includes(s.status))

  const deliveredToday = shipments.filter((s) => {
    if (s.status !== "DELIVERED") return false
    const updated = new Date(s.updatedAt)
    const now = new Date()
    return updated.toDateString() === now.toDateString()
  }).length

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {showScanner && <FlashQrScanner onClose={() => setShowScanner(false)} />}
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-yellow-400 rounded-full p-2.5">
            <Zap className="h-7 w-7 text-black fill-black" />
          </div>
          <div className="flex-1">
            <h1 className="font-black text-xl">⚡ FLASH</h1>
            <p className="text-xs text-gray-500 capitalize">{today}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="h-4 w-4 mr-1" /> Escanear
            </Button>
            <Button variant="outline" size="sm" onClick={load}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Daily stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: "Asignados", value: shipments.length, color: "bg-white border" },
            { label: "Pendientes", value: pending.length + inProgress.length, color: "bg-yellow-50 border-yellow-200" },
            { label: "Entregados hoy", value: deliveredToday, color: "bg-green-50 border-green-200" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl ${s.color} p-3 text-center`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        {/* In progress (arrived) */}
        {inProgress.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase text-yellow-600 mb-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> En domicilio ahora
            </h2>
            <div className="space-y-3">
              {inProgress.map((s) => <DriverShipmentCard key={s.id} shipment={s} highlight />)}
            </div>
          </section>
        )}

        {/* Pending deliveries */}
        {pending.length > 0 && (
          <section className="mb-5">
            <h2 className="text-xs font-bold uppercase text-gray-500 mb-2">Pendientes de entrega</h2>
            <div className="space-y-3">
              {pending.map((s) => <DriverShipmentCard key={s.id} shipment={s} />)}
            </div>
          </section>
        )}

        {/* Completed today */}
        {done.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase text-gray-400 mb-2">Completados</h2>
            <div className="space-y-3">
              {done.map((s) => <DriverShipmentCard key={s.id} shipment={s} dim />)}
            </div>
          </section>
        )}

        {shipments.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle2 className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">Sin pedidos asignados</h3>
            <p className="text-sm text-gray-400 mt-1">Tu lista de pedidos aparecerá aquí.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DriverShipmentCard({
  shipment, highlight, dim,
}: {
  shipment: FlashShipmentWithRelations
  highlight?: boolean
  dim?: boolean
}) {
  const addr = `${shipment.street} ${shipment.streetNumber}, ${shipment.city}`
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`

  return (
    <Card className={`overflow-hidden ${highlight ? "border-yellow-400 ring-1 ring-yellow-300" : ""} ${dim ? "opacity-60" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{shipment.recipientName}</span>
              <FlashStatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-gray-400">Pedido #{shipment.order?.orderNumber}</p>
          </div>
          {shipment.attempts.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-medium">
              Visita {shipment.attempts.length}/3
            </span>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <div className="flex items-start gap-1.5 text-xs text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
            <span>{shipment.street} {shipment.streetNumber}{shipment.apartment ? `, ${shipment.apartment}` : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 opacity-0" />
            <span>Entre {shipment.betweenStreet1} y {shipment.betweenStreet2}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <a href={`https://wa.me/${shipment.recipientPhone.replace(/\D/g, "")}`} className="text-green-600">
              {shipment.recipientPhone}
            </a>
          </div>
        </div>

        {!dim && (
          <div className="flex gap-2">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex-1">
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs">
                <Navigation className="h-3.5 w-3.5 mr-1" /> Maps
              </Button>
            </a>
            <a href={`/flash/scan/${shipment.qrToken}`} className="flex-1">
              <Button size="sm" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xs">
                <QrCode className="h-3.5 w-3.5 mr-1" /> Escanear
              </Button>
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
