"use client"

import { useState, useEffect } from "react"
import {
  Users,
  Search,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Eye,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Package,
  DollarSign,
  Calendar,
  CreditCard,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Buyer {
  id: string
  user_id: string
  email: string
  name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  total_orders: number
  total_spent: number
  last_order?: string
  is_active: boolean
  created_at: string
  last_login?: string
  reputation_score?: number
  return_count?: number
}

export default function CompradoresPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchBuyers()
  }, [filter, currentPage])

  const fetchBuyers = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })

      if (filter === "active") query = query.eq("is_active", true)
      if (filter === "inactive") query = query.eq("is_active", false)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      const formattedBuyers: Buyer[] = data?.map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id || profile.id,
        email: profile.email || "",
        name: profile.name || "Sin nombre",
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
        total_orders: profile.total_orders || 0,
        total_spent: profile.total_spent || 0,
        last_order: profile.last_order,
        is_active: profile.is_active !== false,
        created_at: profile.created_at,
        last_login: profile.last_login,
        reputation_score: profile.reputation_score || 100,
        return_count: profile.return_count || 0,
      })) || []

      setBuyers(formattedBuyers)
      setTotalCount(count || 0)
    } catch (error: any) {
      console.error("Error fetching buyers:", error?.message || error)
      setBuyers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const toggleBuyerStatus = async (buyer: Buyer) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !buyer.is_active })
        .eq("id", buyer.id)

      if (error) throw error

      toast.success(
        buyer.is_active
          ? `Comprador ${buyer.name} suspendido`
          : `Comprador ${buyer.name} activado`
      )
      fetchBuyers()
    } catch (error) {
      console.error("Error updating buyer:", error)
      toast.error("Error al actualizar comprador")
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
        Activo
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
        Suspendido
      </span>
    )
  }

  const filteredBuyers = buyers.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Gestión de Compradores
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} compradores registrados | {buyers.filter(b => b.is_active).length} activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBuyers}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, ID..."
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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos los compradores</option>
            <option value="active">Activos</option>
            <option value="inactive">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Compradores", value: totalCount, icon: Users, color: "blue" },
          { label: "Activos", value: buyers.filter(b => b.is_active).length, icon: CheckCircle, color: "green" },
          { label: "Con Compras", value: buyers.filter(b => b.total_orders > 0).length, icon: ShoppingBag, color: "purple" },
          { label: "Suspendidos", value: buyers.filter(b => !b.is_active).length, icon: Ban, color: "red" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {selectedBuyer ? (
        <BuyerDetail 
          buyer={selectedBuyer} 
          onBack={() => setSelectedBuyer(null)}
          onToggleStatus={() => toggleBuyerStatus(selectedBuyer)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Comprador</th>
                  <th className="p-4 font-semibold text-gray-700">Contacto</th>
                  <th className="p-4 font-semibold text-gray-700">Compras</th>
                  <th className="p-4 font-semibold text-gray-700">Estado</th>
                  <th className="p-4 font-semibold text-gray-700">Registro</th>
                  <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Cargando compradores...
                    </td>
                  </tr>
                ) : filteredBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No se encontraron compradores
                    </td>
                  </tr>
                ) : (
                  filteredBuyers.map((buyer) => (
                    <tr key={buyer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                            {buyer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{buyer.name}</p>
                            <p className="text-xs text-gray-500">{buyer.email}</p>
                            {buyer.city && (
                              <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" /> {buyer.city}, {buyer.state}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">{buyer.email}</p>
                          {buyer.phone && <p className="text-gray-500">{buyer.phone}</p>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{buyer.total_orders} órdenes</p>
                          <p className="text-xs text-gray-500">${buyer.total_spent?.toLocaleString("es-AR")} gastado</p>
                          {buyer.last_order && (
                            <p className="text-xs text-gray-400">
                              Última: {new Date(buyer.last_order).toLocaleDateString("es-AR")}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(buyer.is_active)}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(buyer.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBuyer(buyer)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleBuyerStatus(buyer)}
                            className={`p-1.5 rounded transition-colors ${
                              buyer.is_active
                                ? "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={buyer.is_active ? "Suspender" : "Activar"}
                          >
                            {buyer.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                        </div>
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Componente de detalle del comprador
function BuyerDetail({ 
  buyer, 
  onBack, 
  onToggleStatus 
}: { 
  buyer: Buyer
  onBack: () => void
  onToggleStatus: () => void
}) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"info" | "orders">("info")

  useEffect(() => {
    fetchBuyerOrders()
  }, [buyer.id])

  const fetchBuyerOrders = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data } = await supabase
        .from("orders")
        .select("id, total, status, created_at, seller:seller_id(name)")
        .eq("buyer_id", buyer.user_id)
        .order("created_at", { ascending: false })
        .limit(20)

      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
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
          <div className="bg-green-100 p-2 rounded-md">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{buyer.name}</h3>
            <p className="text-xs text-gray-500">{buyer.email}</p>
          </div>
        </div>
        <button
          onClick={onToggleStatus}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${
            buyer.is_active
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {buyer.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {buyer.is_active ? "Suspender" : "Activar"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        {[
          { id: "info", label: "Información", icon: Users },
          { id: "orders", label: "Órdenes", icon: ShoppingBag },
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
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "info" ? (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Datos del Comprador</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-gray-900">{buyer.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="text-gray-900">{buyer.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{buyer.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="text-gray-900">{buyer.phone || "No especificado"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Dirección:</span>
                  <span className="text-gray-900">{buyer.address || "No especificada"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Ciudad:</span>
                  <span className="text-gray-900">{buyer.city || "No especificada"}, {buyer.state || ""}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">CP:</span>
                  <span className="text-gray-900">{buyer.zip_code || "No especificado"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Registro:</span>
                  <span className="text-gray-900">{new Date(buyer.created_at).toLocaleDateString("es-AR")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Estado:</span>
                  <span className={buyer.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {buyer.is_active ? "Activo" : "Suspendido"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Historial de Compras</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Total Órdenes</p>
                  <p className="text-2xl font-bold text-blue-900">{buyer.total_orders}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Total Gastado</p>
                  <p className="text-2xl font-bold text-green-900">${buyer.total_spent?.toLocaleString("es-AR")}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Última Compra</p>
                  <p className="text-lg font-bold text-purple-900">
                    {buyer.last_order ? new Date(buyer.last_order).toLocaleDateString("es-AR") : "N/A"}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-orange-600 mb-1">Devoluciones</p>
                  <p className="text-2xl font-bold text-orange-900">{buyer.return_count || 0}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Historial de Órdenes</h4>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay órdenes registradas</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Orden #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{order.seller?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${order.total?.toLocaleString("es-AR")}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.status === "DELIVERED" || order.status === "completed" ? "bg-green-100 text-green-700" :
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
