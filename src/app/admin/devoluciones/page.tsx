"use client"

import { useState, useEffect } from "react"
import {
  RotateCcw,
  Search,
  Package,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Truck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Return {
  id: string
  order_id: string
  buyer_id: string
  buyer_email?: string
  buyer_name?: string
  seller_id: string
  seller_name?: string
  product_id: string
  product_title?: string
  reason: string
  reason_category: "defective" | "not_as_described" | "wrong_item" | "changed_mind" | "other"
  status: "requested" | "approved" | "rejected" | "in_transit" | "received" | "refunded" | "closed"
  refund_amount: number
  photos?: string[]
  tracking_number?: string
  shipping_label?: string
  requested_at: string
  resolved_at?: string
  admin_notes?: string
}

export default function DevolucionesPage() {
  const [returns, setReturns] = useState<Return[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "requested" | "approved" | "in_transit" | "received" | "refunded">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null)

  useEffect(() => {
    fetchReturns()
  }, [filter])

  const fetchReturns = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("returns").select("*")
      if (filter !== "all") query = query.eq("status", filter)
      
      const { data, error } = await query.order("requested_at", { ascending: false })
      if (error) throw error
      setReturns(data || [])
    } catch (error) {
      console.error("Error:", error)
      setReturns([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("returns")
        .update({ status, admin_notes: notes, resolved_at: ["refunded", "rejected", "closed"].includes(status) ? new Date().toISOString() : null })
        .eq("id", id)

      if (error) throw error
      toast.success(`Devolución ${status}`)
      fetchReturns()
      setSelectedReturn(null)
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      requested: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      rejected: "bg-red-100 text-red-800",
      in_transit: "bg-purple-100 text-purple-800",
      received: "bg-orange-100 text-orange-800",
      refunded: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    }
    const labels: Record<string, string> = {
      requested: "Solicitada",
      approved: "Aprobada",
      rejected: "Rechazada",
      in_transit: "En tránsito",
      received: "Recibida",
      refunded: "Reembolsada",
      closed: "Cerrada",
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status] || status}</span>
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      defective: "Defectuoso",
      not_as_described: "No coincide descripción",
      wrong_item: "Producto equivocado",
      changed_mind: "Arrepentimiento",
      other: "Otro",
    }
    return labels[reason] || reason
  }

  const filteredReturns = returns.filter(
    (r) =>
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.product_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRefundAmount = returns.filter(r => r.status === "refunded").reduce((acc, r) => acc + r.refund_amount, 0)
  const pendingCount = returns.filter(r => ["requested", "approved", "in_transit", "received"].includes(r.status)).length

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-blue-600" />
            Gestión de Devoluciones
          </h2>
          <p className="text-sm text-gray-500">{returns.length} devoluciones | {pendingCount} pendientes</p>
        </div>
        <button onClick={fetchReturns} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar devolución..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todos los estados</option>
          <option value="requested">Solicitadas</option>
          <option value="approved">Aprobadas</option>
          <option value="in_transit">En tránsito</option>
          <option value="received">Recibidas</option>
          <option value="refunded">Reembolsadas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Solicitadas</p>
          <p className="text-2xl font-bold">{returns.filter(r => r.status === "requested").length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">En Proceso</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Reembolsadas</p>
          <p className="text-2xl font-bold">{returns.filter(r => r.status === "refunded").length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Monto Total Reembolsado</p>
          <p className="text-2xl font-bold">${totalRefundAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Producto</th>
                <th className="p-4 font-semibold text-gray-700">Motivo</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Monto</th>
                <th className="p-4 font-semibold text-gray-700">Fecha</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredReturns.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay devoluciones registradas</td></tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium line-clamp-1">{ret.product_title || "Producto"}</p>
                        <p className="text-xs text-gray-500">Orden: {ret.order_id?.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="p-4">{getReasonLabel(ret.reason_category)}</td>
                    <td className="p-4">{getStatusBadge(ret.status)}</td>
                    <td className="p-4 font-medium">${ret.refund_amount.toLocaleString()}</td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(ret.requested_at).toLocaleDateString("es-AR")}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedReturn(ret)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Devolución #{selectedReturn.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedReturn(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Producto:</span> {selectedReturn.product_title}</div>
                <div><span className="text-gray-500">Orden:</span> {selectedReturn.order_id}</div>
                <div><span className="text-gray-500">Estado:</span> {getStatusBadge(selectedReturn.status)}</div>
                <div><span className="text-gray-500">Monto:</span> ${selectedReturn.refund_amount.toLocaleString()}</div>
                <div><span className="text-gray-500">Motivo:</span> {getReasonLabel(selectedReturn.reason_category)}</div>
                <div><span className="text-gray-500">Fecha:</span> {new Date(selectedReturn.requested_at).toLocaleString("es-AR")}</div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Descripción del cliente:</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedReturn.reason}</p>
              </div>
              {selectedReturn.photos && selectedReturn.photos.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Evidencia:</p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedReturn.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-full h-20 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}
              {selectedReturn.status === "requested" && (
                <div className="border-t pt-4 space-y-3">
                  <textarea 
                    placeholder="Notas del admin..."
                    id="return-notes"
                    className="w-full p-3 border rounded-lg text-sm h-20"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStatus(selectedReturn.id, "approved", (document.getElementById("return-notes") as HTMLTextAreaElement).value)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm"
                    >
                      Aprobar
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedReturn.id, "rejected", (document.getElementById("return-notes") as HTMLTextAreaElement).value)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
              {selectedReturn.status === "received" && (
                <button 
                  onClick={() => updateStatus(selectedReturn.id, "refunded")}
                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm"
                >
                  Marcar como Reembolsada
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
