"use client"

import { useState, useEffect } from "react"
import {
  Megaphone,
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  TrendingUp,
  DollarSign,
  BarChart3,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Ad {
  id: string
  seller_id: string
  seller_name?: string
  title: string
  description?: string
  image_url?: string
  target_url: string
  placement: "home_banner" | "category_sidebar" | "search_results" | "product_page"
  status: "pending" | "active" | "paused" | "rejected" | "ended"
  budget: number
  spent: number
  impressions: number
  clicks: number
  ctr: number
  starts_at: string
  ends_at: string
  created_at: string
  rejection_reason?: string
}

export default function PublicidadPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "paused" | "ended">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchAds()
  }, [filter])

  const fetchAds = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("seller_ads").select("*")
      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setAds(data || [])
    } catch (error) {
      console.error("Error:", error)
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, reason?: string) => {
    const supabase = createClient()
    try {
      const update: any = { status }
      if (reason) update.rejection_reason = reason

      const { error } = await supabase.from("seller_ads").update(update).eq("id", id)
      if (error) throw error
      toast.success(`Anuncio ${status === "active" ? "aprobado" : status === "rejected" ? "rechazado" : "actualizado"}`)
      fetchAds()
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      paused: "bg-gray-100 text-gray-800",
      rejected: "bg-red-100 text-red-800",
      ended: "bg-blue-100 text-blue-800",
    }
    const labels: Record<string, string> = { pending: "Pendiente", active: "Activo", paused: "Pausado", rejected: "Rechazado", ended: "Finalizado" }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{labels[status] || status}</span>
  }

  const getPlacementLabel = (p: string) => {
    const labels: Record<string, string> = {
      home_banner: "Banner Home",
      category_sidebar: "Sidebar Categoría",
      search_results: "Resultados de Búsqueda",
      product_page: "Página de Producto",
    }
    return labels[p] || p
  }

  const filteredAds = ads.filter(
    (a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalRevenue = ads.filter(a => a.status === "active" || a.status === "ended").reduce((acc, a) => acc + (a.spent || 0), 0)
  const totalImpressions = ads.reduce((acc, a) => acc + (a.impressions || 0), 0)
  const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-purple-600" />
            Publicidad (Ads)
          </h2>
          <p className="text-sm text-gray-500">{ads.length} anuncios | {ads.filter(a => a.status === "pending").length} pendientes de aprobación</p>
        </div>
        <button onClick={fetchAds} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar anuncio..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="active">Activos</option>
          <option value="paused">Pausados</option>
          <option value="ended">Finalizados</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Activos</p>
          <p className="text-2xl font-bold">{ads.filter(a => a.status === "active").length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Ingresos Ads</p>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Impresiones</p>
          <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Clicks</p>
          <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Anuncio</th>
                <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                <th className="p-4 font-semibold text-gray-700">Ubicación</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Presupuesto</th>
                <th className="p-4 font-semibold text-gray-700">Rendimiento</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredAds.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay anuncios</td></tr>
              ) : (
                filteredAds.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium line-clamp-1">{ad.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{ad.description}</p>
                    </td>
                    <td className="p-4 text-sm">{ad.seller_name || "Vendedor"}</td>
                    <td className="p-4 text-xs">{getPlacementLabel(ad.placement)}</td>
                    <td className="p-4">{getStatusBadge(ad.status)}</td>
                    <td className="p-4">
                      <p className="font-medium">${ad.budget?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Gastado: ${ad.spent?.toLocaleString() || 0}</p>
                    </td>
                    <td className="p-4 text-xs">
                      <p>{(ad.impressions || 0).toLocaleString()} imp.</p>
                      <p>{(ad.clicks || 0).toLocaleString()} clicks</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ad.status === "pending" && (
                          <>
                            <button onClick={() => updateStatus(ad.id, "active")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Aprobar">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateStatus(ad.id, "rejected", "No cumple las políticas")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Rechazar">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {ad.status === "active" && (
                          <button onClick={() => updateStatus(ad.id, "paused")} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Pausar">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
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
