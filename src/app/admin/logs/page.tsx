"use client"

import { useState, useEffect } from "react"
import {
  ClipboardList,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  User,
  Shield,
  ShoppingCart,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface LogEntry {
  id: string
  user_id?: string
  user_email?: string
  user_name?: string
  action: string
  entity_type: string
  entity_id?: string
  details: any
  ip_address?: string
  user_agent?: string
  severity: "info" | "warning" | "error" | "critical"
  created_at: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "error" | "critical">("all")
  const [entityFilter, setEntityFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const itemsPerPage = 50

  useEffect(() => {
    fetchLogs()
  }, [filter, entityFilter, currentPage])

  const fetchLogs = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("admin_audit_logs")
        .select("*", { count: "exact" })

      if (filter !== "all") query = query.eq("severity", filter)
      if (entityFilter !== "all") query = query.eq("entity_type", entityFilter)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      setLogs(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching logs:", error)
      // Demo data
      setLogs([
        {
          id: "log-001",
          user_email: "admin@maqjeez.com",
          action: "LOGIN",
          entity_type: "admin",
          details: { ip: "192.168.1.1" },
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ])
      setTotalCount(1)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      info: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Info },
      warning: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertTriangle },
      error: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
      critical: { color: "bg-purple-100 text-purple-800 border-purple-200", icon: Shield },
    }
    const { color, icon: Icon } = config[severity] || config.info
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${color}`}>
        <Icon className="w-3 h-3" />
        {severity.toUpperCase()}
      </span>
    )
  }

  const getActionIcon = (action: string) => {
    if (action.includes("LOGIN")) return <User className="w-4 h-4" />
    if (action.includes("ORDER")) return <ShoppingCart className="w-4 h-4" />
    if (action.includes("CREATE")) return <CheckCircle className="w-4 h-4" />
    if (action.includes("DELETE")) return <XCircle className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Registro de Actividad (Logs)
          </h2>
          <p className="text-sm text-gray-500">{totalCount} eventos registrados</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por acción, usuario, entidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todas severidades</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todas entidades</option>
            <option value="user">Usuario</option>
            <option value="order">Orden</option>
            <option value="product">Producto</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Info", value: logs.filter(l => l.severity === "info").length, color: "blue" },
          { label: "Warnings", value: logs.filter(l => l.severity === "warning").length, color: "yellow" },
          { label: "Errors", value: logs.filter(l => l.severity === "error").length, color: "red" },
          { label: "Critical", value: logs.filter(l => l.severity === "critical").length, color: "purple" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-3 rounded-lg border border-${stat.color}-200`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-3 font-semibold text-gray-700">Severidad</th>
                <th className="p-3 font-semibold text-gray-700">Acción</th>
                <th className="p-3 font-semibold text-gray-700">Usuario</th>
                <th className="p-3 font-semibold text-gray-700">Entidad</th>
                <th className="p-3 font-semibold text-gray-700">Fecha</th>
                <th className="p-3 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay logs registrados
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="p-3">{getSeverityBadge(log.severity)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-sm">{log.user_email || "Sistema"}</p>
                        {log.user_name && <p className="text-xs text-gray-500">{log.user_name}</p>}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{log.entity_type}</span>
                      {log.entity_id && <p className="text-xs text-gray-500 font-mono mt-1">{log.entity_id.slice(0, 8)}</p>}
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(log.created_at).toLocaleString("es-AR")}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Detalle del Log</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">ID:</span> <span className="font-mono">{selectedLog.id}</span></div>
                <div><span className="text-gray-500">Severidad:</span> {getSeverityBadge(selectedLog.severity)}</div>
                <div><span className="text-gray-500">Acción:</span> {selectedLog.action}</div>
                <div><span className="text-gray-500">Entidad:</span> {selectedLog.entity_type}</div>
                <div><span className="text-gray-500">Usuario:</span> {selectedLog.user_email || "Sistema"}</div>
                <div><span className="text-gray-500">Fecha:</span> {new Date(selectedLog.created_at).toLocaleString("es-AR")}</div>
                {selectedLog.ip_address && <div><span className="text-gray-500">IP:</span> {selectedLog.ip_address}</div>}
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Detalles:</p>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
