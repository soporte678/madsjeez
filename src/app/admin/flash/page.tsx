"use client"
import { useEffect, useState } from "react"
import { FlashStatusBadge } from "@/components/flash/FlashStatusBadge"
import { FlashTimeline } from "@/components/flash/FlashTimeline"
import { FlashPhotoGallery } from "@/components/flash/FlashPhotoGallery"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Zap, Search, RefreshCw, User, MapPin, Phone,
  Truck, ChevronDown, ChevronUp, UserCheck, AlertTriangle, UserPlus, X,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import type { FlashShipmentWithRelations } from "@/lib/flash/types"
import type { FlashShipmentStatus } from "@prisma/client"

const STATUS_OPTIONS: FlashShipmentStatus[] = [
  "CREATED", "PAYMENT_CONFIRMED", "LABEL_GENERATED", "PACKAGE_READY",
  "ASSIGNED_TO_DRIVER", "IN_TRANSIT", "ARRIVED_AT_ADDRESS", "DELIVERED",
  "FAILED_ATTEMPT_1", "PENDING_VISIT_2", "FAILED_ATTEMPT_2",
  "PENDING_VISIT_3", "FAILED_ATTEMPT_3", "RETURNED_TO_SENDER", "CANCELLED",
]

interface Driver { id: string; user: { name: string | null; email: string } }

export default function AdminFlashPage() {
  const [shipments, setShipments] = useState<FlashShipmentWithRelations[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("ALL")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showAddDriver, setShowAddDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({ email: "", phone: "", vehicleType: "moto" })
  const [addingDriver, setAddingDriver] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [sr, dr] = await Promise.all([
        fetch("/api/flash/shipments?role=admin").then((r) => r.json()),
        fetch("/api/flash/drivers").then((r) => r.json()),
      ])
      setShipments(sr.shipments ?? [])
      setDrivers(dr.drivers ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAssign = async (shipmentId: string, driverId: string) => {
    setAssigning(shipmentId)
    try {
      const r = await fetch(`/api/flash/shipments/${shipmentId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      })
      if (r.ok) await load()
      else { const d = await r.json(); alert(d.error ?? "Error al asignar") }
    } finally {
      setAssigning(null)
    }
  }

  const handleAddDriver = async () => {
    if (!newDriver.email || !newDriver.phone) return
    setAddingDriver(true)
    try {
      // Buscar usuario por email
      const userRes = await fetch(`/api/admin/users/lookup?email=${encodeURIComponent(newDriver.email)}`)
      const userData = await userRes.json()
      if (!userRes.ok || !userData.id) { alert(userData.error ?? "Usuario no encontrado"); return }
      const r = await fetch("/api/flash/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userData.id, phone: newDriver.phone, vehicleType: newDriver.vehicleType }),
      })
      const d = await r.json()
      if (!r.ok) { alert(d.error ?? "Error al registrar"); return }
      setNewDriver({ email: "", phone: "", vehicleType: "moto" })
      setShowAddDriver(false)
      await load()
    } finally {
      setAddingDriver(false)
    }
  }

  const handleStatusChange = async (shipmentId: string, newStatus: FlashShipmentStatus) => {
    setUpdating(shipmentId)
    try {
      const r = await fetch(`/api/flash/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (r.ok) await load()
      else { const d = await r.json(); alert(d.error ?? "Error al actualizar") }
    } finally {
      setUpdating(null)
    }
  }

  const filtered = shipments.filter((s) => {
    const matchStatus = filterStatus === "ALL" || s.status === filterStatus
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      s.recipientName.toLowerCase().includes(q) ||
      s.recipientPhone.includes(q) ||
      (s.order?.orderNumber?.toString() ?? "").includes(q) ||
      s.city.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  // Stats
  const stats = {
    total: shipments.length,
    active: shipments.filter((s) => !["DELIVERED", "RETURNED_TO_SENDER", "CANCELLED"].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    unassigned: shipments.filter((s) => ["CREATED", "PAYMENT_CONFIRMED", "LABEL_GENERATED", "PACKAGE_READY"].includes(s.status) && !s.driverId).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Zap className="h-10 w-10 text-yellow-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 rounded-full p-2">
            <Zap className="h-5 w-5 text-black fill-black" />
          </div>
          <h1 className="text-xl font-black">⚡ Flash — Panel Admin</h1>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
        </Button>
      </div>

      {/* Drivers */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{drivers.length} repartidores activos</p>
        <Button size="sm" variant="outline" onClick={() => setShowAddDriver((v) => !v)}>
          <UserPlus className="h-4 w-4 mr-1" /> Agregar repartidor
        </Button>
      </div>

      {showAddDriver && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">Registrar nuevo repartidor</p>
              <button onClick={() => setShowAddDriver(false)}><X className="h-4 w-4 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label className="text-xs">Email del usuario *</Label>
                <Input placeholder="repartidor@email.com" value={newDriver.email}
                  onChange={(e) => setNewDriver((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Teléfono *</Label>
                <Input placeholder="1145678901" value={newDriver.phone}
                  onChange={(e) => setNewDriver((p) => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Vehículo</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                  value={newDriver.vehicleType}
                  onChange={(e) => setNewDriver((p) => ({ ...p, vehicleType: e.target.value }))}>
                  <option value="moto">Moto</option>
                  <option value="bici">Bici</option>
                  <option value="auto">Auto</option>
                  <option value="furgoneta">Furgoneta</option>
                </select>
              </div>
            </div>
            <Button size="sm" className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
              onClick={handleAddDriver} disabled={addingDriver || !newDriver.email || !newDriver.phone}>
              {addingDriver ? "Registrando..." : "Confirmar"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Activos", value: stats.active, alert: stats.active > 0 },
          { label: "Entregados", value: stats.delivered },
          { label: "Sin asignar", value: stats.unassigned, alert: stats.unassigned > 0 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black ${s.alert && s.value > 0 ? "text-yellow-600" : ""}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, teléfono, pedido, ciudad..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Unassigned alert */}
      {stats.unassigned > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {stats.unassigned} envío{stats.unassigned !== 1 ? "s" : ""} sin repartidor asignado
        </div>
      )}

      {/* Shipment list */}
      <div className="space-y-3">
        {filtered.map((s) => (
          <AdminShipmentRow
            key={s.id}
            shipment={s}
            drivers={drivers}
            isExpanded={expanded === s.id}
            onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
            onAssign={(driverId) => handleAssign(s.id, driverId)}
            onStatusChange={(status) => handleStatusChange(s.id, status)}
            assigning={assigning === s.id}
            updating={updating === s.id}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No se encontraron envíos con ese criterio.
          </div>
        )}
      </div>
    </div>
  )
}

function AdminShipmentRow({
  shipment, drivers, isExpanded, onToggle,
  onAssign, onStatusChange, assigning, updating,
}: {
  shipment: FlashShipmentWithRelations
  drivers: Driver[]
  isExpanded: boolean
  onToggle: () => void
  onAssign: (driverId: string) => void
  onStatusChange: (status: FlashShipmentStatus) => void
  assigning: boolean
  updating: boolean
}) {
  const [selectedDriver, setSelectedDriver] = useState(shipment.driverId ?? "")
  const [selectedStatus, setSelectedStatus] = useState<FlashShipmentStatus>(shipment.status)

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Row header */}
        <button className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50" onClick={onToggle}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{shipment.recipientName}</span>
              <FlashStatusBadge status={shipment.status} />
              {(!shipment.driverId) && (
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">Sin repartidor</span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              #{shipment.order?.orderNumber} · {shipment.city}, {shipment.province} · {new Date(shipment.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {isExpanded && (
          <div className="border-t px-4 py-4 space-y-5 bg-gray-50">
            {/* Recipient info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Destinatario</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-gray-400" />{shipment.recipientName}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />
                    <a href={`https://wa.me/${shipment.recipientPhone.replace(/\D/g, "")}`} className="text-green-600">{shipment.recipientPhone}</a>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
                    <span>{shipment.street} {shipment.streetNumber}{shipment.apartment ? `, ${shipment.apartment}` : ""}, {shipment.city}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Intentos ({shipment.attempts.length}/3)</p>
                {shipment.attempts.length === 0
                  ? <p className="text-xs text-gray-400">Sin intentos</p>
                  : shipment.attempts.map((a) => (
                    <p key={a.id} className="text-xs text-gray-500">
                      Visita {a.attemptNumber}: {new Date(a.createdAt).toLocaleString("es-AR")} — {a.status}
                    </p>
                  ))
                }
              </div>
            </div>

            {/* Assign driver */}
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2 flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Asignar repartidor
              </p>
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.user.name ?? d.user.email}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  className="bg-yellow-400 hover:bg-yellow-500 text-black"
                  onClick={() => selectedDriver && onAssign(selectedDriver)}
                  disabled={assigning || !selectedDriver}
                >
                  <UserCheck className="h-4 w-4 mr-1" />
                  {assigning ? "..." : "Asignar"}
                </Button>
              </div>
            </div>

            {/* Override status */}
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Cambiar estado manualmente</p>
              <div className="flex gap-2">
                <select
                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-white"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as FlashShipmentStatus)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(selectedStatus)}
                  disabled={updating || selectedStatus === shipment.status}
                >
                  {updating ? "..." : "Guardar"}
                </Button>
              </div>
            </div>

            {/* Delivery proof photos */}
            {shipment.deliveryProof?.photos && shipment.deliveryProof.photos.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Fotos de entrega</p>
                <FlashPhotoGallery paths={shipment.deliveryProof.photos} />
              </div>
            )}

            {/* Timeline */}
            {shipment.auditLogs && shipment.auditLogs.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Historial</p>
                <FlashTimeline logs={shipment.auditLogs} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
