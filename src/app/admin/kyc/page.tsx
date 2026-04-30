"use client"

import { useState, useEffect } from "react"
import {
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  AlertTriangle,
  Ban,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface KycRequest {
  id: string
  user_id: string
  user_email: string
  user_name: string
  document_type: "dni" | "passport" | "cuit"
  document_number: string
  document_front_url?: string
  document_back_url?: string
  selfie_url?: string
  address_proof_url?: string
  status: "pending" | "approved" | "rejected"
  rejection_reason?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export default function KycPage() {
  const [requests, setRequests] = useState<KycRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<KycRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")

  useEffect(() => {
    fetchKycRequests()
  }, [filter])

  const fetchKycRequests = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("kyc_verifications")
        .select("*, user:user_id(email, name)")

      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query
        .order("submitted_at", { ascending: false })

      if (error) throw error

      const formatted: KycRequest[] = data?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        user_email: r.user?.email || "",
        user_name: r.user?.name || "",
        document_type: r.document_type,
        document_number: r.document_number,
        document_front_url: r.document_front_url,
        document_back_url: r.document_back_url,
        selfie_url: r.selfie_url,
        address_proof_url: r.address_proof_url,
        status: r.status,
        rejection_reason: r.rejection_reason,
        submitted_at: r.submitted_at,
        reviewed_at: r.reviewed_at,
        reviewed_by: r.reviewed_by,
      })) || []

      setRequests(formatted)
    } catch (error) {
      console.error("Error fetching KYC:", error)
      toast.error("Error al cargar verificaciones")
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("kyc_verifications")
        .update({ 
          status: "approved", 
          reviewed_at: new Date().toISOString() 
        })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Verificación aprobada")
      fetchKycRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error("Error approving:", error)
      toast.error("Error al aprobar")
    }
  }

  const rejectRequest = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Debes indicar un motivo de rechazo")
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("kyc_verifications")
        .update({ 
          status: "rejected", 
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString() 
        })
        .eq("id", requestId)

      if (error) throw error

      toast.success("Verificación rechazada")
      setRejectionReason("")
      fetchKycRequests()
      setSelectedRequest(null)
    } catch (error) {
      console.error("Error rejecting:", error)
      toast.error("Error al rechazar")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      approved: "Aprobado",
      rejected: "Rechazado",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const filteredRequests = requests.filter(
    (r) =>
      r.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.document_number.includes(searchQuery)
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Verificación KYC
          </h2>
          <p className="text-sm text-gray-500">
            {requests.length} solicitudes | {requests.filter(r => r.status === "pending").length} pendientes
          </p>
        </div>
        <button
          onClick={fetchKycRequests}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o documento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: "Pendientes", value: requests.filter(r => r.status === "pending").length, color: "yellow" },
          { label: "Aprobadas", value: requests.filter(r => r.status === "approved").length, color: "green" },
          { label: "Rechazadas", value: requests.filter(r => r.status === "rejected").length, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-lg border border-${stat.color}-200`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Content */}
      {selectedRequest ? (
        <KycDetail 
          request={selectedRequest}
          onBack={() => setSelectedRequest(null)}
          onApprove={() => approveRequest(selectedRequest.id)}
          onReject={() => rejectRequest(selectedRequest.id)}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Usuario</th>
                  <th className="p-4 font-semibold text-gray-700">Documento</th>
                  <th className="p-4 font-semibold text-gray-700">Estado</th>
                  <th className="p-4 font-semibold text-gray-700">Fecha</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No hay solicitudes KYC
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">{request.user_name}</p>
                          <p className="text-xs text-gray-500">{request.user_email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm text-gray-700">{request.document_type.toUpperCase()}</p>
                          <p className="text-xs text-gray-500 font-mono">{request.document_number}</p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(request.status)}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(request.submitted_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(request)}
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
        </div>
      )}
    </div>
  )
}

function KycDetail({ 
  request, 
  onBack, 
  onApprove, 
  onReject,
  rejectionReason,
  setRejectionReason 
}: { 
  request: KycRequest
  onBack: () => void
  onApprove: () => void
  onReject: () => void
  rejectionReason: string
  setRejectionReason: (v: string) => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
            ← Volver
          </button>
          <h3 className="text-lg font-bold text-gray-900">Verificación de {request.user_name}</h3>
        </div>
        {request.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Aprobar
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Información del Usuario</h4>
            <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Nombre:</span>
                <span className="text-gray-900">{request.user_name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900">{request.user_email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Tipo de Documento:</span>
                <span className="text-gray-900 uppercase">{request.document_type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Número:</span>
                <span className="font-mono text-gray-900">{request.document_number}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-500">Estado:</span>
                <span className={request.status === "approved" ? "text-green-600" : request.status === "rejected" ? "text-red-600" : "text-yellow-600"}>
                  {request.status === "approved" ? "Aprobado" : request.status === "rejected" ? "Rechazado" : "Pendiente"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Fecha de Solicitud:</span>
                <span className="text-gray-900">{new Date(request.submitted_at).toLocaleString("es-AR")}</span>
              </div>
            </div>

            {request.status === "pending" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Motivo de rechazo (si aplica):</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Indica el motivo si vas a rechazar..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm h-24"
                />
              </div>
            )}

            {request.rejection_reason && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Motivo de rechazo:</strong> {request.rejection_reason}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Documentos</h4>
            <div className="space-y-4">
              {request.document_front_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Frente del Documento</p>
                  <img 
                    src={request.document_front_url} 
                    alt="Documento frente" 
                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
                  />
                </div>
              )}
              {request.document_back_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Dorso del Documento</p>
                  <img 
                    src={request.document_back_url} 
                    alt="Documento dorso" 
                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
                  />
                </div>
              )}
              {request.selfie_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Selfie con Documento</p>
                  <img 
                    src={request.selfie_url} 
                    alt="Selfie" 
                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
                  />
                </div>
              )}
              {request.address_proof_url && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Comprobante de Domicilio</p>
                  <img 
                    src={request.address_proof_url} 
                    alt="Comprobante" 
                    className="w-full h-48 object-contain bg-gray-100 rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
