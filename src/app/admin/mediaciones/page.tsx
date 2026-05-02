"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Scale,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Dispute {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  product_id: string
  product_title?: string
  buyer_email?: string
  seller_email?: string
  buyer_name?: string
  seller_name?: string
  status: "open" | "in_review" | "resolved_buyer" | "resolved_seller" | "resolved_split" | "closed"
  reason: string
  description: string
  amount_in_dispute: number
  created_at: string
  updated_at: string
  messages_count?: number
}

export default function MediacionesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "in_review" | "resolved">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchDisputes()
  }, [filter])

  const fetchDisputes = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("disputes")
        .select(`
          *,
          product:product_id(title),
          buyer:buyer_id(email, full_name),
          seller:seller_id(email, full_name)
        `)
        .order("created_at", { ascending: false })

      if (filter !== "all") {
        if (filter === "resolved") {
          query = query.in("status", ["resolved_buyer", "resolved_seller", "resolved_split", "closed"])
        } else {
          query = query.eq("status", filter)
        }
      }

      const { data, error } = await query

      if (error) throw error

      const formattedDisputes = data?.map((d: any) => ({
        ...d,
        product_title: d.product?.title,
        buyer_email: d.buyer?.email,
        seller_email: d.seller?.email,
        buyer_name: d.buyer?.full_name,
        seller_name: d.seller?.full_name,
      })) || []

      setDisputes(formattedDisputes)
    } catch (error) {
      console.error("Error fetching disputes:", error)
      toast.error("Error al cargar mediaciones")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      open: "bg-yellow-100 text-yellow-800 border-yellow-200",
      in_review: "bg-blue-100 text-blue-800 border-blue-200",
      resolved_buyer: "bg-green-100 text-green-800 border-green-200",
      resolved_seller: "bg-green-100 text-green-800 border-green-200",
      resolved_split: "bg-purple-100 text-purple-800 border-purple-200",
      closed: "bg-gray-100 text-gray-800 border-gray-200",
    }
    const labels = {
      open: "Abierta",
      in_review: "En Revisión",
      resolved_buyer: "Resuelto (Comprador)",
      resolved_seller: "Resuelto (Vendedor)",
      resolved_split: "Resuelto (División)",
      closed: "Cerrada",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles] || styles.closed}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const filteredDisputes = disputes.filter(
    (d) =>
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.product_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.buyer_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.seller_email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scale className="w-6 h-6 text-orange-600" />
            Mediaciones y Reclamos
          </h2>
          <p className="text-sm text-gray-500">Gestión de disputas entre compradores y vendedores</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">
            {disputes.filter((d) => d.status === "open").length} pendientes
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID, producto, email..."
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
            <option value="all">Todas</option>
            <option value="open">Abiertas</option>
            <option value="in_review">En Revisión</option>
            <option value="resolved">Resueltas</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {selectedDispute ? (
        <DisputeDetail 
          dispute={selectedDispute} 
          onBack={() => setSelectedDispute(null)} 
          onRefresh={fetchDisputes}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">ID / Producto</th>
                  <th className="p-4 font-semibold text-gray-700">Comprador</th>
                  <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                  <th className="p-4 font-semibold text-gray-700">Monto</th>
                  <th className="p-4 font-semibold text-gray-700">Estado</th>
                  <th className="p-4 font-semibold text-gray-700">Creada</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando mediaciones...
                    </td>
                  </tr>
                ) : filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No se encontraron mediaciones
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((dispute) => (
                    <tr key={dispute.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-blue-600">#{dispute.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {dispute.product_title || "Producto no disponible"}
                        </p>
                        <p className="text-xs text-gray-400">{dispute.reason}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{dispute.buyer_name || "Sin nombre"}</p>
                            <p className="text-xs text-gray-500">{dispute.buyer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{dispute.seller_name || "Sin nombre"}</p>
                            <p className="text-xs text-gray-500">{dispute.seller_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">
                          ${dispute.amount_in_dispute?.toLocaleString("es-AR") || "0"}
                        </p>
                      </td>
                      <td className="p-4">{getStatusBadge(dispute.status)}</td>
                      <td className="p-4 text-gray-500">
                        {new Date(dispute.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedDispute(dispute)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Ver detalle →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente de detalle de disputa
function DisputeDetail({ 
  dispute, 
  onBack, 
  onRefresh 
}: { 
  dispute: Dispute
  onBack: () => void
  onRefresh: () => void 
}) {
  const [activeTab, setActiveTab] = useState<"chat" | "evidence" | "history">("chat")
  const [resolution, setResolution] = useState<"" | "buyer" | "seller" | "split" | "logistics">("")
  const [note, setNote] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleResolve = async () => {
    if (!resolution) {
      toast.error("Selecciona un veredicto")
      return
    }
    
    setSubmitting(true)
    const supabase = createClient()
    
    try {
      const statusMap: Record<string, string> = {
        buyer: "resolved_buyer",
        seller: "resolved_seller",
        split: "resolved_split",
        logistics: "resolved_buyer",
      }
      
      const { error } = await supabase
        .from("disputes")
        .update({
          status: statusMap[resolution],
          resolution: note,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", dispute.id)

      if (error) throw error

      toast.success("Mediación resuelta correctamente")
      onRefresh()
      onBack()
    } catch (error) {
      console.error("Error resolving dispute:", error)
      toast.error("Error al resolver la mediación")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="bg-red-100 p-2 rounded-md">
            <Scale className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Disputa #{dispute.id.slice(0, 8)}</h3>
            <p className="text-xs text-gray-500">
              {dispute.product_title} • ${dispute.amount_in_dispute?.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
            Transferir a Nivel 2
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat/Evidence */}
        <div className="flex-1 border-r border-gray-200 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: "chat", label: "Chat", icon: MessageSquare },
              { id: "evidence", label: "Evidencias", icon: AlertCircle },
              { id: "history", label: "Historial", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {activeTab === "chat" && (
              <div className="space-y-4">
                {/* Warning Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Modo Dios activado.</span> Estás viendo el chat entre el comprador y vendedor. Cualquier mensaje que envíes será visible para ambos.
                  </p>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {/* Buyer Message */}
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-bold text-gray-500 ml-1 mb-1">COMPRADOR</span>
                    <div className="max-w-[80%] bg-white border border-gray-200 p-3 rounded-lg rounded-tl-none shadow-sm">
                      <p className="text-sm text-gray-800">{dispute.description}</p>
                    </div>
                  </div>

                  {/* Placeholder seller response */}
                  <div className="flex flex-col items-end mt-4">
                    <span className="text-[10px] font-bold text-gray-500 mr-1 mb-1">VENDEDOR</span>
                    <div className="max-w-[80%] bg-green-50 border border-green-200 p-3 rounded-lg rounded-tr-none shadow-sm">
                      <p className="text-sm text-gray-800">
                        Estamos revisando el caso. Necesitamos más información sobre el problema reportado.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="mt-4">
                  <textarea
                    placeholder="Escribir mensaje como Moderador MadsJeez..."
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                  <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                    Enviar mensaje
                  </button>
                </div>
              </div>
            )}

            {activeTab === "evidence" && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No hay evidencias cargadas aún</p>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Disputa creada</p>
                    <p className="text-xs text-gray-500">{new Date(dispute.created_at).toLocaleString("es-AR")}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Notificación enviada al vendedor</p>
                    <p className="text-xs text-gray-500">{new Date(dispute.created_at).toLocaleString("es-AR")}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Resolution Panel */}
        <div className="w-80 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 border-b border-gray-200">
            <h4 className="font-bold text-gray-900 mb-4">Dictar Veredicto</h4>

            <div className="space-y-2">
              <button
                onClick={() => setResolution("seller")}
                className={`w-full flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                  resolution === "seller"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-green-300 hover:bg-green-50"
                }`}
              >
                <CheckCircle className={`w-5 h-5 mb-1 ${resolution === "seller" ? "text-green-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${resolution === "seller" ? "text-green-700" : "text-gray-700"}`}>
                  A favor del Vendedor
                </span>
                <span className="text-[10px] text-gray-500 mt-1">Liberar pago. Cerrar reclamo.</span>
              </button>

              <button
                onClick={() => setResolution("buyer")}
                className={`w-full flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                  resolution === "buyer"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <CheckCircle className={`w-5 h-5 mb-1 ${resolution === "buyer" ? "text-blue-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${resolution === "buyer" ? "text-blue-700" : "text-gray-700"}`}>
                  A favor del Comprador
                </span>
                <span className="text-[10px] text-gray-500 mt-1">Reembolsar dinero. Afectar reputación.</span>
              </button>

              <button
                onClick={() => setResolution("split")}
                className={`w-full flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                  resolution === "split"
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                }`}
              >
                <Scale className={`w-5 h-5 mb-1 ${resolution === "split" ? "text-purple-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${resolution === "split" ? "text-purple-700" : "text-gray-700"}`}>
                  División 50/50
                </span>
                <span className="text-[10px] text-gray-500 mt-1">Ambas partes reciben compensación.</span>
              </button>

              <button
                onClick={() => setResolution("logistics")}
                className={`w-full flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-colors ${
                  resolution === "logistics"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                <Package className={`w-5 h-5 mb-1 ${resolution === "logistics" ? "text-orange-600" : "text-gray-400"}`} />
                <span className={`font-bold text-sm ${resolution === "logistics" ? "text-orange-700" : "text-gray-700"}`}>
                  Siniestro Logístico
                </span>
                <span className="text-[10px] text-gray-500 mt-1">Reclamo al correo. Cobertura de seguro.</span>
              </button>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notas internas de la resolución..."
              className="w-full mt-4 border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
            />

            <button
              onClick={handleResolve}
              disabled={submitting || !resolution}
              className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Resolviendo..." : "Aplicar Veredicto"}
            </button>
          </div>

          {/* Order Info */}
          <div className="p-5">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Información de Orden</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Orden:</span>
                <Link 
                  href={`/admin/ordenes/${dispute.order_id}`}
                  className="text-blue-600 hover:underline"
                >
                  #{dispute.order_id.slice(0, 8)}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Producto:</span>
                <span className="text-gray-900 truncate max-w-[120px]">
                  {dispute.product_title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Monto:</span>
                <span className="font-medium">${dispute.amount_in_dispute?.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
