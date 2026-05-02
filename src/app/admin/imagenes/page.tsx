"use client"

import { useState, useEffect } from "react"
import {
  ImageOff,
  Search,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Trash2,
  Flag,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FlaggedImage {
  id: string
  product_id: string
  product_title?: string
  seller_id: string
  seller_name?: string
  image_url: string
  reason: "inappropriate" | "misleading" | "low_quality" | "watermark" | "copyright" | "other"
  status: "pending" | "approved" | "rejected" | "replaced"
  reported_by?: string
  admin_notes?: string
  created_at: string
}

export default function ImagenesPage() {
  const [images, setImages] = useState<FlaggedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchImages()
  }, [filter])

  const fetchImages = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase.from("flagged_images").select("*")
      if (filter !== "all") query = query.eq("status", filter)

      const { data, error } = await query.order("created_at", { ascending: false })
      if (error) throw error
      setImages(data || [])
    } catch (error) {
      console.error("Error:", error)
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string, notes?: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("flagged_images")
        .update({ status, admin_notes: notes })
        .eq("id", id)

      if (error) throw error
      toast.success(`Imagen ${status === "approved" ? "aprobada" : "rechazada"}`)
      fetchImages()
    } catch (error) {
      toast.error("Error al actualizar")
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      inappropriate: "Contenido inapropiado",
      misleading: "Imagen engañosa",
      low_quality: "Baja calidad",
      watermark: "Marca de agua",
      copyright: "Derechos de autor",
      other: "Otro",
    }
    return labels[reason] || reason
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      replaced: "bg-blue-100 text-blue-800",
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      approved: "Aprobada",
      rejected: "Rechazada",
      replaced: "Reemplazada",
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>{labels[status] || status}</span>
  }

  const filteredImages = images.filter(
    (i) =>
      i.product_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.seller_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ImageOff className="w-6 h-6 text-orange-600" />
            Cola de Imágenes Reportadas
          </h2>
          <p className="text-sm text-gray-500">
            {images.length} imágenes | {images.filter(i => i.status === "pending").length} pendientes
          </p>
        </div>
        <button onClick={fetchImages} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por producto o vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Pendientes</p>
          <p className="text-2xl font-bold">{images.filter(i => i.status === "pending").length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Rechazadas</p>
          <p className="text-2xl font-bold">{images.filter(i => i.status === "rejected").length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border">
          <p className="text-xs text-gray-500">Aprobadas</p>
          <p className="text-2xl font-bold">{images.filter(i => i.status === "approved").length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg border">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p className="text-gray-700 font-medium">No hay imágenes pendientes de revisión</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto">
          {filteredImages.map((img) => (
            <div key={img.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="relative">
                <img
                  src={img.image_url}
                  alt={img.product_title || "Imagen reportada"}
                  className="w-full h-40 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg" }}
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(img.status)}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="font-medium text-sm line-clamp-1">{img.product_title || "Producto"}</p>
                <p className="text-xs text-gray-500">{img.seller_name || "Vendedor"}</p>
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">{getReasonLabel(img.reason)}</span>
                </div>
                {img.status === "pending" && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateStatus(img.id, "approved")}
                      className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-1.5 rounded text-xs"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => updateStatus(img.id, "rejected")}
                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-1.5 rounded text-xs"
                    >
                      <XCircle className="w-3 h-3" />
                      Rechazar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
