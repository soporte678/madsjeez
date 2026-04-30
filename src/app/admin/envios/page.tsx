"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Truck,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Package,
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Shipment {
  id: string
  order_id: string
  tracking_number?: string
  carrier: string
  status: "pending" | "ready" | "picked_up" | "in_transit" | "delayed" | "delivered" | "returned"
  seller_id: string
  seller_name?: string
  seller_email?: string
  estimated_delivery?: string
  actual_delivery?: string
  delay_reason?: string
  created_at: string
  updated_at: string
  days_delayed?: number
}

export default function EnviosPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "delayed" | "in_transit" | "pending">("all")
  const [carrierFilter, setCarrierFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Demo data
  const demoShipments: Shipment[] = [
    {
      id: "ship-001",
      order_id: "ord-001",
      tracking_number: "TRK-18847291",
      carrier: "Andreani",
      status: "delayed",
      seller_id: "seller-1",
      seller_name: "Ferretería Industrial Sur",
      seller_email: "ventas@ferreteriasur.com",
      estimated_delivery: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date().toISOString(),
      delay_reason: "Demora en centro de distribución",
      days_delayed: 2,
    },
    {
      id: "ship-002",
      order_id: "ord-002",
      tracking_number: "TRK-28847292",
      carrier: "Correo Argentino",
      status: "delayed",
      seller_id: "seller-2",
      seller_name: "Maquinaria Norte",
      seller_email: "contacto@maq-norte.com",
      estimated_delivery: new Date(Date.now() + 172800000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
      delay_reason: "Paro de transporte",
      days_delayed: 3,
    },
    {
      id: "ship-003",
      order_id: "ord-003",
      tracking_number: "TRK-38847293",
      carrier: "OCA",
      status: "in_transit",
      seller_id: "seller-3",
      seller_name: "Repuestos Pro",
      seller_email: "info@repuestospro.com",
      estimated_delivery: new Date(Date.now() + 43200000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "ship-004",
      order_id: "ord-004",
      tracking_number: "TRK-48847294",
      carrier: "Andreani",
      status: "delayed",
      seller_id: "seller-4",
      seller_name: "AgroTools SRL",
      seller_email: "pedidos@agrotools.com",
      estimated_delivery: new Date(Date.now() + 259200000).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date().toISOString(),
      days_delayed: 4,
    },
    {
      id: "ship-005",
      order_id: "ord-005",
      carrier: "Moto",
      status: "pending",
      seller_id: "seller-5",
      seller_name: "Ferretería Central",
      seller_email: "ventas@ferrecentral.com",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setShipments(demoShipments)
      setLoading(false)
    }, 500)
  }, [])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-gray-100 text-gray-700",
      ready: "bg-blue-100 text-blue-700",
      picked_up: "bg-indigo-100 text-indigo-700",
      in_transit: "bg-yellow-100 text-yellow-700",
      delayed: "bg-red-100 text-red-700",
      delivered: "bg-green-100 text-green-700",
      returned: "bg-purple-100 text-purple-700",
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      ready: "Listo para despacho",
      picked_up: "Retirado",
      in_transit: "En tránsito",
      delayed: "Demorado",
      delivered: "Entregado",
      returned: "Devuelto",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const handleCancelAndPenalize = async (shipmentId: string) => {
    toast.success("Envío cancelado y vendedor penalizado")
    setShipments(prev => prev.filter(s => s.id !== shipmentId))
  }

  const handleContactSeller = (email: string) => {
    window.open(`mailto:${email}?subject=Demora en envío - MaqJeez`, "_blank")
  }

  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = filter === "all" || s.status === filter
    const matchesCarrier = carrierFilter === "all" || s.carrier === carrierFilter
    const matchesSearch =
      searchQuery === "" ||
      s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesCarrier && matchesSearch
  })

  const carriers = Array.from(new Set(shipments.map((s) => s.carrier)))
  const delayedCount = shipments.filter((s) => s.status === "delayed").length

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Radar de Envíos / Demoras
          </h2>
          <p className="text-sm text-gray-500">Envíos con SLA vencido por culpa del vendedor</p>
        </div>
        <div className="flex items-center gap-2">
          {delayedCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
              {delayedCount} demorados
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por tracking, orden o vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los estados</option>
            <option value="delayed">Demorados</option>
            <option value="in_transit">En tránsito</option>
            <option value="pending">Pendientes</option>
          </select>
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los operadores</option>
            {carriers.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Envíos", value: shipments.length, color: "blue" },
          { label: "Demorados", value: delayedCount, color: "red", alert: delayedCount > 0 },
          { label: "En Tránsito", value: shipments.filter(s => s.status === "in_transit").length, color: "yellow" },
          { label: "Pendientes", value: shipments.filter(s => s.status === "pending").length, color: "gray" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-white p-4 rounded-lg border ${stat.alert ? "border-red-200" : "border-gray-200"}`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.alert ? "text-red-600" : "text-gray-900"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Orden / Tracking</th>
                <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Operador</th>
                <th className="p-4 font-semibold text-gray-700">Entrega Est.</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Cargando envíos...
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No se encontraron envíos
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      shipment.status === "delayed" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/ordenes/${shipment.order_id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        #{shipment.order_id.slice(0, 8)}
                      </Link>
                      {shipment.tracking_number && (
                        <p className="text-xs text-gray-500 mt-1">
                          {shipment.tracking_number}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {shipment.seller_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {shipment.seller_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(shipment.status)}
                        {shipment.days_delayed && shipment.days_delayed > 0 && (
                          <div className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {shipment.days_delayed} días de atraso
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-gray-400" />
                        {shipment.carrier}
                      </div>
                    </td>
                    <td className="p-4">
                      {shipment.estimated_delivery ? (
                        <div>
                          <p className="text-gray-900">
                            {new Date(shipment.estimated_delivery).toLocaleDateString("es-AR")}
                          </p>
                          {shipment.delay_reason && (
                            <p className="text-xs text-red-500">
                              {shipment.delay_reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin estimación</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {shipment.status === "delayed" && (
                          <button
                            onClick={() => handleCancelAndPenalize(shipment.id)}
                            className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-1.5 rounded hover:bg-red-50 shadow-sm transition-colors"
                          >
                            Cancelar y Penalizar
                          </button>
                        )}
                        <button
                          onClick={() => handleContactSeller(shipment.seller_email || "")}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Contactar vendedor"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/admin/ordenes/${shipment.order_id}`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver orden"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
