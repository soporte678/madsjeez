"use client"

import { useState, useEffect } from "react"
import {
  CreditCard,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Subscription {
  id: string
  seller_id: string
  seller_name?: string
  seller_email?: string
  plan: "free" | "basic" | "pro" | "enterprise"
  status: "active" | "cancelled" | "expired" | "trial" | "past_due"
  amount: number
  billing_cycle: "monthly" | "annual"
  current_period_start: string
  current_period_end: string
  trial_ends_at?: string
  features: string[]
  created_at: string
  cancelled_at?: string
}

export default function SuscripcionesPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "cancelled" | "trial" | "past_due">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchSubscriptions()
  }, [filter])

  const fetchSubscriptions = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("seller_subscriptions").select("*")
      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error:", error)
      setSubscriptions([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient()
    try {
      const update: any = { status }
      if (status === "cancelled") update.cancelled_at = new Date().toISOString()

      const { error } = await supabase.from("seller_subscriptions").update(update).eq("id", id)
      if (error) throw error
      toast.success(`Suscripción ${status === "active" ? "activada" : "actualizada"}`)
      fetchSubscriptions()
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      basic: "bg-blue-100 text-blue-800",
      pro: "bg-purple-100 text-purple-800",
      enterprise: "bg-yellow-100 text-yellow-800",
    }
    const labels: Record<string, string> = { free: "Gratis", basic: "Básico", pro: "Pro", enterprise: "Enterprise" }
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors[plan]}`}>{labels[plan] || plan}</span>
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      trial: "bg-blue-100 text-blue-800",
      past_due: "bg-orange-100 text-orange-800",
    }
    const labels: Record<string, string> = { active: "Activa", cancelled: "Cancelada", expired: "Expirada", trial: "Trial", past_due: "Vencida" }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{labels[status] || status}</span>
  }

  const filteredSubs = subscriptions.filter(
    (s) => s.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.seller_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const mrr = subscriptions.filter(s => s.status === "active").reduce((acc, s) => {
    return acc + (s.billing_cycle === "annual" ? Number(s.amount) / 12 : s.amount)
  }, 0)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-green-600" />
            Suscripciones de Vendedores
          </h2>
          <p className="text-sm text-gray-500">{subscriptions.length} suscripciones | {subscriptions.filter(s => s.status === "active").length} activas</p>
        </div>
        <button onClick={fetchSubscriptions} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar por vendedor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="trial">Trial</option>
          <option value="past_due">Vencidas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">MRR</p>
          <p className="text-2xl font-bold">${Math.round(mrr).toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Activas</p>
          <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === "active").length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">En Trial</p>
          <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === "trial").length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Vencidas</p>
          <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === "past_due").length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                <th className="p-4 font-semibold text-gray-700">Plan</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Monto</th>
                <th className="p-4 font-semibold text-gray-700">Ciclo</th>
                <th className="p-4 font-semibold text-gray-700">Período</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredSubs.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay suscripciones</td></tr>
              ) : (
                filteredSubs.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{sub.seller_name || "Vendedor"}</p>
                      <p className="text-xs text-gray-500">{sub.seller_email}</p>
                    </td>
                    <td className="p-4">{getPlanBadge(sub.plan)}</td>
                    <td className="p-4">{getStatusBadge(sub.status)}</td>
                    <td className="p-4 font-medium">${sub.amount.toLocaleString()}</td>
                    <td className="p-4 text-xs text-gray-600">{sub.billing_cycle === "monthly" ? "Mensual" : "Anual"}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString("es-AR") : "-"} -
                      {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("es-AR") : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {sub.status === "past_due" && (
                          <button onClick={() => updateStatus(sub.id, "active")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Reactivar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {sub.status === "active" && (
                          <button onClick={() => updateStatus(sub.id, "cancelled")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
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
