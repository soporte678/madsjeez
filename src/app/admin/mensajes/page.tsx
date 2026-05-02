"use client"

import { useState, useEffect } from "react"
import {
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Edit3,
  Search,
  Filter,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FlaggedMessage {
  id: string
  question_id?: string
  message_id?: string
  buyer_id: string
  seller_id: string
  product_id: string
  question_text: string
  answer_text?: string
  buyer_name?: string
  seller_name?: string
  product_title?: string
  infraction_type: "phone" | "external_link" | "external_price" | "suspicious" | "other"
  severity: "low" | "medium" | "high"
  ai_confidence: number
  status: "pending" | "approved" | "rejected" | "edited"
  created_at: string
}

export default function MensajesPage() {
  const [messages, setMessages] = useState<FlaggedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "high_severity">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMessages()
  }, [filter])

  const fetchMessages = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("flagged_messages")
        .select("*")

      if (filter === "pending") query = query.eq("status", "pending")
      if (filter === "approved") query = query.eq("status", "approved")
      if (filter === "high_severity") query = query.eq("severity", "high")

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const getInfractionLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone: "Evasión de comisión (Teléfono)",
      external_link: "Desvío de tráfico",
      external_price: "Precio por fuera",
      suspicious: "Comportamiento sospechoso",
      other: "Otro",
    }
    return labels[type] || type
  }

  const getSeverityBadge = (severity: string) => {
    const styles = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    }
    const labels = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[severity as keyof typeof styles]}`}>
        {labels[severity as keyof typeof labels]}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      edited: "bg-blue-100 text-blue-700",
    }
    const labels = {
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
      edited: "Editado",
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const handleAction = async (messageId: string, action: "approve" | "reject" | "edit") => {
    const supabase = createClient()
    const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "edited"

    try {
      const { error } = await supabase
        .from("flagged_messages")
        .update({ status: newStatus })
        .eq("id", messageId)

      if (error) throw error

      toast.success(
        action === "approve" 
          ? "Mensaje aprobado" 
          : action === "reject" 
          ? "Mensaje rechazado e infracción aplicada" 
          : "Mensaje editado y aprobado"
      )
      fetchMessages()
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al actualizar mensaje")
    }
  }

  const filteredMessages = messages.filter((m) => {
    if (filter === "pending") return m.status === "pending"
    if (filter === "approved") return m.status === "approved"
    if (filter === "high_severity") return m.severity === "high"
    return true
  }).filter((m) =>
    searchQuery === "" ||
    m.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.answer_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.seller_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-purple-600" />
            Moderación de Preguntas y Respuestas
          </h2>
          <p className="text-sm text-gray-500">Revisión de mensajes interceptados por IA</p>
        </div>
        <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
          {messages.filter((m) => m.status === "pending").length} pendientes
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar mensajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobados</option>
            <option value="high_severity">Alta severidad</option>
          </select>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Cargando mensajes...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p className="text-gray-700 font-medium">No hay mensajes pendientes</p>
            <p className="text-sm text-gray-500">Todos los mensajes han sido revisados</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white p-5 rounded-lg border border-red-200 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">
                    {getInfractionLabel(message.infraction_type)}
                  </span>
                  {getSeverityBadge(message.severity)}
                  {getStatusBadge(message.status)}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(message.created_at).toLocaleString("es-AR")}
                </span>
              </div>

              {/* Content */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Question & Answer */}
                <div className="space-y-3">
                  <div className="pl-4 border-l-2 border-blue-300">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Pregunta (Comprador)</span>
                    <p className="text-sm text-gray-800 italic mt-1">
                      &ldquo;{message.question_text}&rdquo;
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{message.buyer_name}</p>
                  </div>

                  {message.answer_text && (
                    <div className="pl-4 border-l-2 border-red-300">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">Respuesta Interceptada (Vendedor)</span>
                      <p className="text-sm font-bold text-gray-900 bg-red-50 p-2 rounded mt-1">
                        &ldquo;{message.answer_text}&rdquo;
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{message.seller_name}</p>
                    </div>
                  )}
                </div>

                {/* AI Confidence & Product Info */}
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Confianza de IA</span>
                      <span className={`text-sm font-bold ${message.ai_confidence > 0.8 ? "text-red-600" : "text-yellow-600"}`}>
                        {(message.ai_confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${message.ai_confidence > 0.8 ? "bg-red-500" : "bg-yellow-500"}`}
                        style={{ width: `${message.ai_confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm">
                    <span className="text-gray-500">Producto: </span>
                    <span className="font-medium">{message.product_title}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {message.status === "pending" && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleAction(message.id, "reject")}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded shadow-sm transition-colors"
                  >
                    <Ban className="w-4 h-4" />
                    Eliminar e Infraccionar
                  </button>
                  <button
                    onClick={() => handleAction(message.id, "edit")}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold py-2 px-4 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar y Permitir
                  </button>
                  <button
                    onClick={() => handleAction(message.id, "approve")}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold py-2 px-4 rounded transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprobar (Falso Positivo)
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
