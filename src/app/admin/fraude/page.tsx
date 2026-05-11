"use client"

import { useState, useEffect } from "react"
import {
  ShieldAlert,
  Search,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  UserX,
  Flag,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FraudCase {
  id: string
  user_id: string
  user_email: string
  user_name: string
  type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  /** JSON / adjuntos desde `fraud_logs`; opcional para filas parciales o demo. */
  evidence?: unknown
  status: "open" | "investigating" | "resolved" | "false_positive"
  reporter_id?: string
  reporter_email?: string
  created_at: string
  resolved_at?: string
  resolution_notes?: string
  assigned_to?: string
}

export default function FraudePage() {
  const [cases, setCases] = useState<FraudCase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<FraudCase | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "investigating" | "resolved">("all")
  const [severityFilter, setSeverityFilter] = useState<"all" | "low" | "medium" | "high" | "critical">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchFraudCases()
  }, [filter, severityFilter, currentPage])

  const fetchFraudCases = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("fraud_logs")
        .select("*", { count: "exact" })

      if (filter !== "all") query = query.eq("status", filter)
      if (severityFilter !== "all") query = query.eq("severity", severityFilter)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      setCases(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching fraud cases:", error)
      // Use demo data if table doesn't exist
      setCases([
        {
          id: "1",
          user_id: "user1",
          user_email: "sospechoso@email.com",
          user_name: "Usuario Sospechoso",
          type: "multiple_accounts",
          severity: "high",
          description: "Múltiples cuentas desde mismo IP",
          evidence: null,
          status: "investigating",
          created_at: new Date().toISOString(),
        },
      ])
      setTotalCount(1)
    } finally {
      setLoading(false)
    }
  }

  const updateCaseStatus = async (caseId: string, status: string, notes?: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("fraud_logs")
        .update({ 
          status, 
          resolution_notes: notes,
          resolved_at: status === "resolved" ? new Date().toISOString() : null 
        })
        .eq("id", caseId)

      if (error) throw error

      toast.success(`Caso actualizado a: ${status}`)
      fetchFraudCases()
    } catch (error) {
      console.error("Error updating case:", error)
      toast.error("Error al actualizar caso")
    }
  }

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800 border-gray-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      critical: "bg-red-100 text-red-800 border-red-200",
    }
    const labels: Record<string, string> = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      critical: "Crítica",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[severity] || colors.low}`}>
        {labels[severity] || severity}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-red-100 text-red-800 border-red-200",
      investigating: "bg-yellow-100 text-yellow-800 border-yellow-200",
      resolved: "bg-green-100 text-green-800 border-green-200",
      false_positive: "bg-gray-100 text-gray-800 border-gray-200",
    }
    const labels: Record<string, string> = {
      open: "Abierto",
      investigating: "Investigando",
      resolved: "Resuelto",
      false_positive: "Falso Positivo",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.open}`}>
        {labels[status] || status}
      </span>
    )
  }

  const filteredCases = cases.filter(
    (c) =>
      c.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Control de Estafas
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} casos registrados | {cases.filter(c => c.status === "open").length} abiertos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFraudCases}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="investigating">Investigando</option>
            <option value="resolved">Resueltos</option>
          </select>
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value as any)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todas las severidades</option>
            <option value="critical">Crítica</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Casos Abiertos", value: cases.filter(c => c.status === "open").length, color: "red" },
          { label: "Investigando", value: cases.filter(c => c.status === "investigating").length, color: "yellow" },
          { label: "Resueltos", value: cases.filter(c => c.status === "resolved").length, color: "green" },
          { label: "Críticos", value: cases.filter(c => c.severity === "critical").length, color: "orange" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-lg border border-${stat.color}-200`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cases Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Usuario</th>
                <th className="p-4 font-semibold text-gray-700">Tipo</th>
                <th className="p-4 font-semibold text-gray-700">Severidad</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Fecha</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay casos de fraude registrados
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{c.user_name}</p>
                        <p className="text-xs text-gray-500">{c.user_email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-700">{c.type}</td>
                    <td className="p-4">{getSeverityBadge(c.severity)}</td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(c.created_at).toLocaleDateString("es-AR")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.status === "open" && (
                          <button
                            onClick={() => updateCaseStatus(c.id, "investigating")}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Investigar"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        {c.status !== "resolved" && (
                          <button
                            onClick={() => updateCaseStatus(c.id, "resolved", "Caso resuelto")}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Marcar resuelto"
                          >
                            <CheckCircle className="w-4 h-4" />
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
