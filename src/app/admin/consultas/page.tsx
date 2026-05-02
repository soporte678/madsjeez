"use client"

import { useState, useEffect } from "react"
import {
  Inbox,
  Search,
  Eye,
  CheckCircle,
  Clock,
  RefreshCw,
  Send,
  User,
  Mail,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Inquiry {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  status: "pending" | "in_progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high"
  category: "general" | "billing" | "technical" | "complaint" | "suggestion"
  admin_reply?: string
  assigned_to?: string
  created_at: string
  resolved_at?: string
}

export default function ConsultasPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "resolved">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [reply, setReply] = useState("")

  useEffect(() => {
    fetchInquiries()
  }, [filter])

  const fetchInquiries = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("contact_inquiries").select("*")
      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setInquiries(data || [])
    } catch (error) {
      console.error("Error:", error)
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, adminReply?: string) => {
    const supabase = createClient()
    try {
      const update: any = { status }
      if (adminReply) update.admin_reply = adminReply
      if (status === "resolved") update.resolved_at = new Date().toISOString()

      const { error } = await supabase
        .from("contact_inquiries")
        .update(update)
        .eq("id", id)

      if (error) throw error
      toast.success("Consulta actualizada")
      fetchInquiries()
      setSelectedInquiry(null)
      setReply("")
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      in_progress: "En curso",
      resolved: "Resuelta",
      closed: "Cerrada",
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{labels[status] || status}</span>
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = { low: "text-gray-500", medium: "text-yellow-600", high: "text-red-600" }
    const labels: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" }
    return <span className={`text-xs font-semibold ${colors[priority]}`}>{labels[priority]}</span>
  }

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      general: "General",
      billing: "Facturación",
      technical: "Técnico",
      complaint: "Reclamo",
      suggestion: "Sugerencia",
    }
    return labels[cat] || cat
  }

  const filteredInquiries = inquiries.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-blue-600" />
            Consultas Generales
          </h2>
          <p className="text-sm text-gray-500">
            {inquiries.length} consultas | {inquiries.filter(i => i.status === "pending").length} pendientes
          </p>
        </div>
        <button onClick={fetchInquiries} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o asunto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="in_progress">En curso</option>
          <option value="resolved">Resueltas</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold">{inquiries.filter(i => i.status === "pending").length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">En Curso</p>
          <p className="text-2xl font-bold">{inquiries.filter(i => i.status === "in_progress").length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Resueltas</p>
          <p className="text-2xl font-bold">{inquiries.filter(i => i.status === "resolved").length}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-2xl font-bold">{inquiries.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Remitente</th>
                <th className="p-4 font-semibold text-gray-700">Asunto</th>
                <th className="p-4 font-semibold text-gray-700">Categoría</th>
                <th className="p-4 font-semibold text-gray-700">Prioridad</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Fecha</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredInquiries.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay consultas registradas</td></tr>
              ) : (
                filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{inquiry.name}</p>
                        <p className="text-xs text-gray-500">{inquiry.email}</p>
                      </div>
                    </td>
                    <td className="p-4 max-w-[200px] truncate">{inquiry.subject}</td>
                    <td className="p-4">{getCategoryLabel(inquiry.category)}</td>
                    <td className="p-4">{getPriorityBadge(inquiry.priority)}</td>
                    <td className="p-4">{getStatusBadge(inquiry.status)}</td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(inquiry.created_at).toLocaleDateString("es-AR")}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedInquiry(inquiry)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
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

      {selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Consulta: {selectedInquiry.subject}</h3>
              <button onClick={() => setSelectedInquiry(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Nombre:</span> {selectedInquiry.name}</div>
                <div><span className="text-gray-500">Email:</span> {selectedInquiry.email}</div>
                <div><span className="text-gray-500">Categoría:</span> {getCategoryLabel(selectedInquiry.category)}</div>
                <div><span className="text-gray-500">Estado:</span> {getStatusBadge(selectedInquiry.status)}</div>
              </div>
              <div>
                <p className="text-gray-500 text-sm mb-2">Mensaje:</p>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedInquiry.message}</p>
              </div>
              {selectedInquiry.admin_reply && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Respuesta del admin:</p>
                  <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">{selectedInquiry.admin_reply}</p>
                </div>
              )}
              {selectedInquiry.status !== "resolved" && selectedInquiry.status !== "closed" && (
                <div className="border-t pt-4 space-y-3">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="w-full p-3 border rounded-lg text-sm h-24"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(selectedInquiry.id, "in_progress")}
                      className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      <Clock className="w-4 h-4" />
                      Marcar En Curso
                    </button>
                    <button
                      onClick={() => updateStatus(selectedInquiry.id, "resolved", reply)}
                      className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      <Send className="w-4 h-4" />
                      Resolver y Responder
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
