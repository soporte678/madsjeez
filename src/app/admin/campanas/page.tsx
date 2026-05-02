"use client"

import { useState, useEffect } from "react"
import {
  Zap,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Percent,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Campaign {
  id: string
  name: string
  description: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_purchase?: number
  max_uses?: number
  current_uses: number
  status: "draft" | "scheduled" | "active" | "ended" | "cancelled"
  starts_at: string
  ends_at: string
  categories?: string[]
  products_count?: number
  created_at: string
}

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "scheduled" | "ended">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: "", description: "", discount_type: "percentage" as const, discount_value: 10,
    min_purchase: 0, max_uses: 0, starts_at: "", ends_at: "", status: "draft" as const,
  })

  useEffect(() => {
    fetchCampaigns()
  }, [filter])

  const fetchCampaigns = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("flash_campaigns").select("*")
      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error("Error:", error)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.starts_at || !newCampaign.ends_at) {
      toast.error("Completa los campos requeridos")
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("flash_campaigns")
        .insert({ ...newCampaign, current_uses: 0 })

      if (error) throw error
      toast.success("Campaña creada")
      setShowCreate(false)
      setNewCampaign({ name: "", description: "", discount_type: "percentage", discount_value: 10, min_purchase: 0, max_uses: 0, starts_at: "", ends_at: "", status: "draft" })
      fetchCampaigns()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al crear campaña")
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase.from("flash_campaigns").update({ status }).eq("id", id)
      if (error) throw error
      toast.success(`Campaña ${status === "active" ? "activada" : status === "cancelled" ? "cancelada" : "actualizada"}`)
      fetchCampaigns()
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm("¿Eliminar esta campaña?")) return
    const supabase = createClient()
    try {
      const { error } = await supabase.from("flash_campaigns").delete().eq("id", id)
      if (error) throw error
      toast.success("Campaña eliminada")
      fetchCampaigns()
    } catch (error) {
      toast.error("Error al eliminar")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      ended: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    }
    const labels: Record<string, string> = { draft: "Borrador", scheduled: "Programada", active: "Activa", ended: "Finalizada", cancelled: "Cancelada" }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{labels[status] || status}</span>
  }

  const filteredCampaigns = campaigns.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Campañas Flash
          </h2>
          <p className="text-sm text-gray-500">{campaigns.length} campañas | {campaigns.filter(c => c.status === "active").length} activas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCampaigns} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            <Plus className="w-4 h-4" />
            Nueva Campaña
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar campaña..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="scheduled">Programadas</option>
          <option value="ended">Finalizadas</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg border"><p className="text-xs text-gray-500">Activas</p><p className="text-2xl font-bold">{campaigns.filter(c => c.status === "active").length}</p></div>
        <div className="bg-blue-50 p-4 rounded-lg border"><p className="text-xs text-gray-500">Programadas</p><p className="text-2xl font-bold">{campaigns.filter(c => c.status === "scheduled").length}</p></div>
        <div className="bg-yellow-50 p-4 rounded-lg border"><p className="text-xs text-gray-500">Finalizadas</p><p className="text-2xl font-bold">{campaigns.filter(c => c.status === "ended").length}</p></div>
        <div className="bg-gray-50 p-4 rounded-lg border"><p className="text-xs text-gray-500">Usos Totales</p><p className="text-2xl font-bold">{campaigns.reduce((acc, c) => acc + (c.current_uses || 0), 0)}</p></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Campaña</th>
                <th className="p-4 font-semibold text-gray-700">Descuento</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Período</th>
                <th className="p-4 font-semibold text-gray-700">Usos</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay campañas</td></tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                    </td>
                    <td className="p-4 font-medium">
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value.toLocaleString()}`}
                    </td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {c.starts_at ? new Date(c.starts_at).toLocaleDateString("es-AR") : "-"} - {c.ends_at ? new Date(c.ends_at).toLocaleDateString("es-AR") : "-"}
                    </td>
                    <td className="p-4">{c.current_uses || 0}{c.max_uses ? `/${c.max_uses}` : ""}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "draft" && (
                          <button onClick={() => updateStatus(c.id, "active")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Activar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {c.status === "active" && (
                          <button onClick={() => updateStatus(c.id, "cancelled")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteCampaign(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Nueva Campaña Flash</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <input type="text" value={newCampaign.name} onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm" placeholder="Ej: Black Friday 2026" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <textarea value={newCampaign.description} onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de descuento</label>
                  <select value={newCampaign.discount_type} onChange={(e) => setNewCampaign(prev => ({ ...prev, discount_type: e.target.value as any }))} className="w-full p-2.5 border rounded-lg text-sm">
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto fijo ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor del descuento</label>
                  <input type="number" value={newCampaign.discount_value} onChange={(e) => setNewCampaign(prev => ({ ...prev, discount_value: parseFloat(e.target.value) }))} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha inicio *</label>
                  <input type="datetime-local" value={newCampaign.starts_at} onChange={(e) => setNewCampaign(prev => ({ ...prev, starts_at: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha fin *</label>
                  <input type="datetime-local" value={newCampaign.ends_at} onChange={(e) => setNewCampaign(prev => ({ ...prev, ends_at: e.target.value }))} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Compra mínima ($)</label>
                  <input type="number" value={newCampaign.min_purchase} onChange={(e) => setNewCampaign(prev => ({ ...prev, min_purchase: parseInt(e.target.value) }))} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usos máximos (0 = ilimitado)</label>
                  <input type="number" value={newCampaign.max_uses} onChange={(e) => setNewCampaign(prev => ({ ...prev, max_uses: parseInt(e.target.value) }))} className="w-full p-2.5 border rounded-lg text-sm" />
                </div>
              </div>
              <button onClick={createCampaign} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium">
                Crear Campaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
