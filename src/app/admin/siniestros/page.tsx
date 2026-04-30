"use client"

import { useState, useEffect } from "react"
import {
  AlertTriangle,
  Search,
  Truck,
  Package,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  FileText,
  Image,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Incident {
  id: string
  shipment_id: string
  order_id: string
  type: "lost" | "damaged" | "delayed" | "stolen"
  severity: "low" | "medium" | "high"
  description: string
  photos?: string[]
  claim_amount?: number
  status: "reported" | "investigating" | "resolved" | "rejected"
  resolution?: string
  compensation_amount?: number
  reported_by: string
  reporter_email?: string
  created_at: string
  resolved_at?: string
}

export default function SiniestrosPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "reported" | "investigating" | "resolved">("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  useEffect(() => {
    fetchIncidents()
  }, [filter, typeFilter])

  const fetchIncidents = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("shipping_incidents").select("*")

      if (filter !== "all") query = query.eq("status", filter)
      if (typeFilter !== "all") query = query.eq("type", typeFilter)

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setIncidents(data || [])
    } catch (error) {
      console.error("Error:", error)
      setIncidents([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, resolution?: string, compensation?: number) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("shipping_incidents")
        .update({ 
          status, 
          resolution, 
          compensation_amount: compensation,
          resolved_at: status === "resolved" ? new Date().toISOString() : null 
        })
        .eq("id", id)

      if (error) throw error
      toast.success("Siniestro actualizado")
      fetchIncidents()
      setSelectedIncident(null)
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = { lost: "Perdida", damaged: "Dañado", delayed: "Retrasado", stolen: "Robado" }
    const colors: Record<string, string> = { 
      lost: "bg-red-100 text-red-800", 
      damaged: "bg-orange-100 text-orange-800", 
      delayed: "bg-yellow-100 text-yellow-800", 
      stolen: "bg-purple-100 text-purple-800" 
    }
    return <span className={`px-2 py-1 rounded text-xs ${colors[type]}`}>{labels[type] || type}</span>
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      reported: "bg-red-100 text-red-800",
      investigating: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-gray-100 text-gray-800",
    }
    const labels: Record<string, string> = { reported: "Reportado", investigating: "Investigando", resolved: "Resuelto", rejected: "Rechazado" }
    return <span className={`px-2 py-1 rounded text-xs ${colors[status]}`}>{labels[status] || status}</span>
  }

  const filteredIncidents = incidents.filter(
    (i) =>
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Siniestros Logísticos
          </h2>
          <p className="text-sm text-gray-500">
            {incidents.length} siniestros | {incidents.filter(i => i.status === "reported").length} sin resolver
          </p>
        </div>
        <button onClick={fetchIncidents} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar siniestro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Todos los estados</option>
            <option value="reported">Reportados</option>
            <option value="investigating">Investigando</option>
            <option value="resolved">Resueltos</option>
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
            <option value="all">Todos los tipos</option>
            <option value="lost">Perdida</option>
            <option value="damaged">Dañado</option>
            <option value="delayed">Retrasado</option>
            <option value="stolen">Robado</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Reportados", value: incidents.filter(i => i.status === "reported").length, color: "red" },
          { label: "Investigando", value: incidents.filter(i => i.status === "investigating").length, color: "yellow" },
          { label: "Resueltos", value: incidents.filter(i => i.status === "resolved").length, color: "green" },
          { label: "Monto Reclamado", value: `$${incidents.reduce((acc, i) => acc + (i.claim_amount || 0), 0).toLocaleString()}`, color: "blue" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-lg border`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Tipo</th>
                <th className="p-4 font-semibold text-gray-700">Descripción</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Monto</th>
                <th className="p-4 font-semibold text-gray-700">Fecha</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredIncidents.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay siniestros registrados</td></tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="p-4">{getTypeBadge(incident.type)}</td>
                    <td className="p-4"><p className="line-clamp-2">{incident.description}</p></td>
                    <td className="p-4">{getStatusBadge(incident.status)}</td>
                    <td className="p-4">{incident.claim_amount ? `$${incident.claim_amount.toLocaleString()}` : "-"}</td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(incident.created_at).toLocaleDateString("es-AR")}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedIncident(incident)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
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
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Siniestro #{selectedIncident.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedIncident(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Tipo:</span> {getTypeBadge(selectedIncident.type)}</div>
                <div><span className="text-gray-500">Estado:</span> {getStatusBadge(selectedIncident.status)}</div>
                <div><span className="text-gray-500">Orden:</span> {selectedIncident.order_id}</div>
                <div><span className="text-gray-500">Fecha:</span> {new Date(selectedIncident.created_at).toLocaleString("es-AR")}</div>
                <div><span className="text-gray-500">Monto reclamado:</span> {selectedIncident.claim_amount ? `$${selectedIncident.claim_amount.toLocaleString()}` : "-"}</div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Descripción:</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedIncident.description}</p>
              </div>
              {selectedIncident.photos && selectedIncident.photos.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Evidencia fotográfica:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedIncident.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-full h-24 object-cover rounded border" />
                    ))}
                  </div>
                </div>
              )}
              {selectedIncident.status !== "resolved" && selectedIncident.status !== "rejected" && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold">Resolver Siniestro</h4>
                  <textarea 
                    placeholder="Notas de resolución..."
                    id="resolution-notes"
                    className="w-full p-3 border rounded-lg text-sm h-20"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      placeholder="Monto de compensación"
                      id="compensation"
                      className="flex-1 p-2 border rounded-lg text-sm"
                    />
                    <button 
                      onClick={() => {
                        const notes = (document.getElementById("resolution-notes") as HTMLTextAreaElement).value
                        const comp = parseFloat((document.getElementById("compensation") as HTMLInputElement).value) || 0
                        updateStatus(selectedIncident.id, "resolved", notes, comp)
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Resolver
                    </button>
                    <button 
                      onClick={() => updateStatus(selectedIncident.id, "rejected")}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
