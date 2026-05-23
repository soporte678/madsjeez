"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { FlashDeliveryConfirm } from "@/components/flash/FlashDeliveryConfirm"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, User, Package, Navigation, Zap, CheckCircle2 } from "lucide-react"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"

export default function FlashScanPage() {
  const { token } = useParams<{ token: string }>()
  const { data: session, status } = useSession()
  const [shipment, setShipment] = useState<FlashShipmentWithRelations | null>(null)
  const [mapsUrl, setMapsUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return
    fetch(`/api/flash/qr/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return }
        setShipment(d.shipment)
        setMapsUrl(d.mapsUrl)
      })
      .catch(() => setError("Error al cargar el pedido"))
      .finally(() => setLoading(false))
  }, [token, status])

  const handlePickup = async () => {
    if (!shipment) return
    const res = await fetch(`/api/flash/shipments/${shipment.id}/pickup`, { method: "POST" })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Error al confirmar retiro"); return }
    setShipment((s) => s ? { ...s, status: "IN_TRANSIT" } : s)
    setDone(true)
  }

  const registerArrive = async (lat?: number, lng?: number) => {
    if (!shipment) return
    const res = await fetch(`/api/flash/shipments/${shipment.id}/arrive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? "Error al registrar llegada"); return }
    // Agregar el nuevo intento al state para que activeAttempt no sea null
    setShipment((s) => s ? {
      ...s,
      status: "ARRIVED_AT_ADDRESS",
      attempts: [...s.attempts, { ...data.attempt, photos: [] }],
    } : s)
    setShowConfirm(true)
  }

  const handleArrive = () => {
    if (!shipment) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => registerArrive(pos.coords.latitude, pos.coords.longitude),
        () => registerArrive(),
      )
    } else {
      registerArrive()
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Zap className="h-12 w-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-500">Cargando pedido...</p>
        </div>
      </div>
    )
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-sm w-full"><CardContent className="p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </CardContent></Card>
    </div>
  )

  if (!shipment) return null

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">¡Operación registrada!</h2>
        <p className="text-gray-500 mt-2">El estado del pedido fue actualizado correctamente.</p>
      </div>
    </div>
  )

  const activeAttempt = shipment.attempts.find((a) => a.status === "IN_PROGRESS")

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      {/* Header Flash */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-yellow-400 rounded-full p-2">
          <Zap className="h-6 w-6 text-black fill-black" />
        </div>
        <div>
          <h1 className="font-black text-lg">⚡ FLASH</h1>
          <p className="text-xs text-gray-500">Pedido #{shipment.order?.orderNumber}</p>
        </div>
        <div className="ml-auto">
          <FlashStatusBadge status={shipment.status} />
        </div>
      </div>

      {/* Datos del destinatario */}
      <Card className="mb-3">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-gray-400">Destinatario</p>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-semibold">{shipment.recipientName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <a href={`https://wa.me/${shipment.recipientPhone.replace(/\D/g, "")}`} className="text-green-600 font-medium">
              {shipment.recipientPhone}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{shipment.street} {shipment.streetNumber}{shipment.apartment ? `, ${shipment.apartment}` : ""}</p>
              <p className="text-gray-500">Entre {shipment.betweenStreet1} y {shipment.betweenStreet2}</p>
              <p className="text-gray-500">{shipment.city}, {shipment.province} — CP {shipment.postalCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intentos anteriores */}
      {shipment.attempts.length > 0 && (
        <Card className="mb-3 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">Intentos anteriores: {shipment.attempts.length}/3</p>
            {shipment.attempts.map((a) => (
              <p key={a.id} className="text-xs text-amber-600">
                Visita {a.attemptNumber}: {new Date(a.createdAt).toLocaleString("es-AR")} — {a.status}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      {!showConfirm && (
        <div className="space-y-3">
          {/* Pickup: driver scanned at seller's location */}
          {["ACCEPTED_BY_DRIVER", "DRIVER_EN_ROUTE_TO_PICKUP", "ASSIGNED_TO_DRIVER", "PACKAGE_READY"].includes(shipment.status) && (
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              onClick={handlePickup}
            >
              <Package className="h-4 w-4 mr-2" /> ✅ Confirmar retiro del paquete
            </Button>
          )}

          {/* In transit: driver heads to recipient */}
          {["IN_TRANSIT", "ARRIVED_AT_ADDRESS", "PENDING_VISIT_2", "PENDING_VISIT_3"].includes(shipment.status) && (
            <>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Navigation className="h-4 w-4 mr-2" /> Abrir Google Maps
                </Button>
              </a>
              <Button
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
                onClick={handleArrive}
              >
                <Package className="h-4 w-4 mr-2" /> Confirmar llegada al domicilio
              </Button>
            </>
          )}

          {/* Already delivered / returned */}
          {["DELIVERED", "RETURNED_TO_SENDER", "RETURNED_TO_SELLER", "CANCELLED"].includes(shipment.status) && (
            <div className="text-center text-gray-500 text-sm py-4">
              Este envío ya está finalizado.
            </div>
          )}
        </div>
      )}

      {/* Confirmación de entrega */}
      {showConfirm && activeAttempt && (
        <Card>
          <CardContent className="p-4">
            <FlashDeliveryConfirm
              shipmentId={shipment.id}
              attemptId={activeAttempt.id}
              recipientName={shipment.recipientName}
              recipientDni={shipment.recipientDni}
              authorizedPeople={shipment.authorizedPeople}
              arrivedAt={activeAttempt.arrivedAt ?? new Date()}
              onDelivered={() => setDone(true)}
              onFailed={() => setDone(true)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
