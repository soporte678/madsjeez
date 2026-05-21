"use client"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import { FlashTimeline } from "@/components/flash/FlashTimeline"
import { FlashPhotoGallery } from "@/components/flash/FlashPhotoGallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Zap, Package, Printer, ChevronDown, ChevronUp, RefreshCw,
  MapPin, Phone, User, Clock,
} from "lucide-react"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"

export default function SellerFlashPage() {
  const { data: session, status } = useSession()
  const [shipments, setShipments] = useState<FlashShipmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [printing, setPrinting] = useState<string | null>(null)
  const [markingReady, setMarkingReady] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/flash/shipments")
      const d = await r.json()
      setShipments(d.shipments ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") load()
  }, [status])

  const handleMarkReady = async (id: string) => {
    setMarkingReady(id)
    try {
      const r = await fetch(`/api/flash/shipments/${id}/ready`, { method: "POST" })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? "Error al marcar como listo"); return }
      await load()
    } finally {
      setMarkingReady(null)
    }
  }

  const handlePrintLabel = async (id: string) => {
    setPrinting(id)
    try {
      const r = await fetch(`/api/flash/shipments/${id}/label`, { method: "POST" })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? "Error al generar etiqueta"); return }
      const win = window.open("", "_blank")
      if (win) { win.document.write(d.html); win.document.close(); win.print() }
    } finally {
      setPrinting(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Zap className="h-10 w-10 text-yellow-400 animate-pulse" />
      </div>
    )
  }

  const active = shipments.filter((s) => !["DELIVERED", "RETURNED_TO_SENDER", "RETURNED_TO_SELLER", "CANCELLED"].includes(s.status))
  const done = shipments.filter((s) => ["DELIVERED", "RETURNED_TO_SENDER", "RETURNED_TO_SELLER"].includes(s.status))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 rounded-full p-2">
              <Zap className="h-6 w-6 text-black fill-black" />
            </div>
            <div>
              <h1 className="text-xl font-black">⚡ Mis envíos Flash</h1>
              <p className="text-xs text-gray-500">{shipments.length} envíos totales</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Activos", value: active.length, color: "bg-yellow-50 border-yellow-200" },
            { label: "Entregados", value: shipments.filter((s) => s.status === "DELIVERED").length, color: "bg-green-50 border-green-200" },
            { label: "Devueltos", value: shipments.filter((s) => s.status === "RETURNED_TO_SENDER").length, color: "bg-red-50 border-red-200" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border p-3 text-center ${stat.color}`}>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Active shipments */}
        {active.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-bold uppercase text-gray-500 mb-3">En curso</h2>
            <div className="space-y-3">
              {active.map((s) => (
                <ShipmentCard
                  key={s.id}
                  shipment={s}
                  isExpanded={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  onPrint={() => handlePrintLabel(s.id)}
                  onMarkReady={() => handleMarkReady(s.id)}
                  printing={printing === s.id}
                  markingReady={markingReady === s.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Done shipments */}
        {done.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase text-gray-500 mb-3">Finalizados</h2>
            <div className="space-y-3">
              {done.map((s) => (
                <ShipmentCard
                  key={s.id}
                  shipment={s}
                  isExpanded={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  onPrint={() => handlePrintLabel(s.id)}
                  onMarkReady={() => {}}
                  printing={printing === s.id}
                  markingReady={false}
                />
              ))}
            </div>
          </section>
        )}

        {shipments.length === 0 && (
          <div className="text-center py-16">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">Sin envíos Flash</h3>
            <p className="text-sm text-gray-400 mt-1">Tus envíos Flash aparecerán aquí cuando se generen.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ShipmentCard({
  shipment, isExpanded, onToggle, onPrint, onMarkReady, printing, markingReady,
}: {
  shipment: FlashShipmentWithRelations
  isExpanded: boolean
  onToggle: () => void
  onPrint: () => void
  onMarkReady: () => void
  printing: boolean
  markingReady: boolean
}) {
  const canPrint = !["DELIVERED", "RETURNED_TO_SENDER", "RETURNED_TO_SELLER", "CANCELLED"].includes(shipment.status)
  const canMarkReady = ["LABEL_GENERATED", "PACKAGE_READY"].includes(shipment.status)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Summary row */}
        <button className="w-full text-left px-4 py-3 flex items-center gap-3" onClick={onToggle}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm truncate">{shipment.recipientName}</span>
              <FlashStatusBadge status={shipment.status} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Pedido #{shipment.order?.orderNumber} · {shipment.city}, {shipment.province}
            </p>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
        </button>

        {/* Detail */}
        {isExpanded && (
          <div className="border-t px-4 py-4 space-y-4 bg-gray-50">
            {/* Recipient */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase text-gray-400">Destinatario</p>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3.5 w-3.5 text-gray-400" />
                {shipment.recipientName} · DNI {shipment.recipientDni}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                <a href={`https://wa.me/${shipment.recipientPhone.replace(/\D/g, "")}`} className="text-green-600">
                  {shipment.recipientPhone}
                </a>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                <span>{shipment.street} {shipment.streetNumber}{shipment.apartment ? `, ${shipment.apartment}` : ""} — {shipment.city}</span>
              </div>
            </div>

            {/* Attempts */}
            {shipment.attempts.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                  Intentos de entrega ({shipment.attempts.length}/3)
                </p>
                {shipment.attempts.map((a) => (
                  <div key={a.id} className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Visita {a.attemptNumber}: {new Date(a.createdAt).toLocaleString("es-AR")} — {a.status}
                  </div>
                ))}
              </div>
            )}

            {/* Driver */}
            {shipment.driver && (
              <div className="text-xs text-gray-500">
                Repartidor: <span className="font-medium text-gray-700">{shipment.driver.user?.name ?? "—"}</span>
              </div>
            )}

            {/* Fotos de evidencia de entrega */}
            {shipment.deliveryProof?.photos && shipment.deliveryProof.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Fotos de entrega</p>
                <FlashPhotoGallery paths={shipment.deliveryProof.photos} />
              </div>
            )}

            {/* Audit logs */}
            {shipment.auditLogs && shipment.auditLogs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Historial</p>
                <FlashTimeline logs={shipment.auditLogs} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {canPrint && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrint}
                  disabled={printing}
                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {printing ? "Generando..." : "Imprimir etiqueta"}
                </Button>
              )}
              {canMarkReady && (
                <Button
                  size="sm"
                  onClick={onMarkReady}
                  disabled={markingReady}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {markingReady ? "Publicando..." : "✅ Listo para retirar"}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
