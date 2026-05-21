"use client"
import { useEffect, useState } from "react"
import { use } from "react"
import { FLASH_STATUS_LABELS, FLASH_STATUS_COLORS } from "@/lib/flash/types"
import type { FlashShipmentStatus } from "@prisma/client"
import {
  Zap, Package, Truck, CheckCircle2, Clock, MapPin, Star,
  AlertCircle, RefreshCw, ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type TrackData = {
  id: string
  status: FlashShipmentStatus
  city: string
  province: string
  recipientName: string
  updatedAt: string
  createdAt: string
  driver?: {
    user: { name: string | null }
    vehicleType: string | null
    rating: number
  } | null
  attempts: { attemptNumber: number; status: string; createdAt: string }[]
  auditLogs: {
    action: string
    previousStatus: string | null
    newStatus: string | null
    createdAt: string
  }[]
  deliveryProof?: {
    receiverName: string
    receiverType: string
    signedAt: string
    photos: string[]
  } | null
  order: {
    orderNumber: string
    seller: { storeName: string | null; city: string | null }
  }
}

const STATUS_STEPS: FlashShipmentStatus[] = [
  "CREATED",
  "PAYMENT_CONFIRMED",
  "LABEL_GENERATED",
  "PACKAGE_READY",
  "AVAILABLE",
  "ACCEPTED_BY_DRIVER",
  "PACKAGE_PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_AT_ADDRESS",
  "DELIVERED",
]

const TERMINAL_STATUSES: FlashShipmentStatus[] = [
  "DELIVERED",
  "RETURNED_TO_SENDER",
  "RETURNED_TO_SELLER",
  "CANCELLED",
  "FAILED_ATTEMPT_3",
]

function statusIcon(status: FlashShipmentStatus) {
  if (status === "DELIVERED") return <CheckCircle2 className="h-5 w-5 text-green-500" />
  if (["IN_TRANSIT", "ACCEPTED_BY_DRIVER", "PACKAGE_PICKED_UP", "DRIVER_EN_ROUTE_TO_PICKUP"].includes(status))
    return <Truck className="h-5 w-5 text-yellow-500" />
  if (["RETURNED_TO_SENDER", "RETURNED_TO_SELLER", "CANCELLED"].includes(status))
    return <AlertCircle className="h-5 w-5 text-red-500" />
  return <Package className="h-5 w-5 text-gray-500" />
}

export default function TrackPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = use(params)
  const [data, setData] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/flash/track/${orderNumber}`)
      if (!r.ok) {
        const d = await r.json()
        setError(d.error ?? "Envío no encontrado")
        return
      }
      const d = await r.json()
      setData(d.shipment)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [orderNumber])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Zap className="h-12 w-12 text-yellow-400 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h1 className="text-white text-xl font-bold text-center">{error ?? "Envío no encontrado"}</h1>
        <p className="text-gray-400 text-sm text-center">
          Verificá el número de pedido e intentá nuevamente.
        </p>
      </div>
    )
  }

  const stepIdx = STATUS_STEPS.indexOf(data.status)
  const isTerminal = TERMINAL_STATUSES.includes(data.status)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-400/10 to-transparent border-b border-white/10 px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-yellow-400 rounded-full p-2">
              <Zap className="h-6 w-6 text-black fill-black" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Flash Delivery</p>
              <h1 className="text-lg font-black">Seguimiento de envío</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={load}
              className="ml-auto text-gray-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Status pill */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${FLASH_STATUS_COLORS[data.status]}`}>
            {statusIcon(data.status)}
            {FLASH_STATUS_LABELS[data.status]}
          </div>

          <p className="text-xs text-gray-400 mt-2">
            Pedido #{data.order.orderNumber} · Para {data.recipientName} · {data.city}, {data.province}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress bar */}
        {!isTerminal && stepIdx >= 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Progreso</p>
            <div className="space-y-2">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIdx
                const current = i === stepIdx
                return (
                  <div key={step} className={`flex items-center gap-3 text-sm ${done ? "text-white" : "text-gray-600"}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${current ? "bg-yellow-400" : done ? "bg-green-500" : "bg-gray-700"}`} />
                    <span className={current ? "font-bold text-yellow-300" : ""}>{FLASH_STATUS_LABELS[step]}</span>
                    {current && <ArrowRight className="h-3 w-3 text-yellow-400" />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Driver info */}
        {data.driver && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Tu repartidor</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                <Truck className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold">{data.driver.user.name ?? "Repartidor asignado"}</p>
                {data.driver.vehicleType && (
                  <p className="text-xs text-gray-400 capitalize">{data.driver.vehicleType}</p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-bold">{data.driver.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Delivery proof */}
        {data.deliveryProof && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase text-green-400 mb-2">✅ Entrega confirmada</p>
            <p className="text-sm">
              Recibido por <span className="font-bold">{data.deliveryProof.receiverName}</span>
              {" "}({data.deliveryProof.receiverType})
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(data.deliveryProof.signedAt).toLocaleString("es-AR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
        )}

        {/* Failed attempts */}
        {data.attempts.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">
              Intentos de entrega ({data.attempts.length}/3)
            </p>
            {data.attempts.map((a) => (
              <div key={a.attemptNumber} className="flex items-center gap-2 text-sm mb-1">
                <Clock className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                <span>Visita {a.attemptNumber}: {a.status}</span>
                <span className="text-gray-500 text-xs ml-auto">
                  {new Date(a.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {data.auditLogs.length > 0 && (
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-3">Historial</p>
            <div className="space-y-3">
              {data.auditLogs
                .filter((l) => l.newStatus)
                .map((log, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium">
                        {log.newStatus ? FLASH_STATUS_LABELS[log.newStatus as FlashShipmentStatus] ?? log.newStatus : log.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* From seller */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            Enviado desde{" "}
            {data.order.seller.storeName ?? "vendedor"}{data.order.seller.city ? `, ${data.order.seller.city}` : ""}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Última actualización: {new Date(data.updatedAt).toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    </div>
  )
}
