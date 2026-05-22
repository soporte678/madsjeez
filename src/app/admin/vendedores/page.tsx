"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Store,
  Search,
  Filter,
  Star,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  UserCheck,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Seller {
  id: string
  user_id: string
  email: string
  name: string
  seller_name: string
  phone?: string
  reputation_level: string
  reputation_color: string
  reputation_score: number
  total_sales: number
  total_orders: number
  is_active: boolean
  is_verified: boolean
  created_at: string
  last_login?: string
  products_count?: number
  pending_orders?: number
  return_rate?: number
}

export default function VendedoresPage() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "verified" | "suspended">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    fetchSellers()
  }, [filter, currentPage])

  const fetchSellers = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("is_seller", true)

      if (filter === "active") query = query.eq("is_active", true)
      if (filter === "inactive") query = query.eq("is_active", false)
      if (filter === "verified") query = query.eq("is_verified", true)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      const formattedSellers: Seller[] = data?.map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id || profile.id,
        email: profile.email || "",
        name: profile.name || "",
        seller_name: profile.seller_name || profile.name || "Sin nombre",
        phone: profile.phone,
        reputation_level: profile.reputation_level || "VENDEDOR NUEVO",
        reputation_color: profile.reputation_color || "VERDE",
        reputation_score: profile.reputation_score || 0,
        total_sales: profile.total_sales || 0,
        total_orders: profile.total_orders || 0,
        is_active: profile.is_active !== false,
        is_verified: profile.is_verified || false,
        created_at: profile.created_at,
        last_login: profile.last_login,
        products_count: profile.products_count || 0,
        pending_orders: profile.pending_orders || 0,
        return_rate: profile.return_rate || 0,
      })) || []

      setSellers(formattedSellers)
      setTotalCount(count || 0)
    } catch (error: any) {
      console.error("Error fetching sellers:", error?.message || error)
      setSellers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const toggleSellerStatus = async (seller: Seller) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !seller.is_active })
        .eq("id", seller.id)

      if (error) throw error

      toast.success(
        seller.is_active
          ? `Vendedor ${seller.seller_name} suspendido`
          : `Vendedor ${seller.seller_name} activado`
      )
      fetchSellers()
    } catch (error) {
      console.error("Error updating seller:", error)
      toast.error("Error al actualizar vendedor")
    }
  }

  const verifySeller = async (seller: Seller) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("id", seller.id)

      if (error) throw error

      toast.success(`Vendedor ${seller.seller_name} verificado`)
      fetchSellers()
    } catch (error) {
      console.error("Error verifying seller:", error)
      toast.error("Error al verificar vendedor")
    }
  }

  const getReputationBadge = (level: string, color: string) => {
    const colorClasses: Record<string, string> = {
      "VERDE": "bg-green-100 text-green-800 border-green-200",
      "AMARILLO": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "ROJO": "bg-red-100 text-red-800 border-red-200",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colorClasses[color] || colorClasses["VERDE"]}`}>
        {level}
      </span>
    )
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

  const filteredSellers = sellers.filter(
    (s) =>
      s.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Store className="w-6 h-6 text-blue-600" />
            Gestión de Vendedores
          </h2>
          <p className="text-sm text-gray-500">
            {totalCount} vendedores registrados | {sellers.filter(s => s.is_active).length} activos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSellers}
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
            <option value="all">Todos los vendedores</option>
            <option value="active">Activos</option>
            <option value="inactive">Suspendidos</option>
            <option value="verified">Verificados</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Vendedores", value: totalCount, icon: Store, color: "blue" },
          { label: "Activos", value: sellers.filter(s => s.is_active).length, icon: CheckCircle, color: "green" },
          { label: "Verificados", value: sellers.filter(s => s.is_verified).length, icon: UserCheck, color: "purple" },
          { label: "Suspendidos", value: sellers.filter(s => !s.is_active).length, icon: Ban, color: "red" },
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
      {selectedSeller ? (
        <SellerDetail 
          seller={selectedSeller} 
          onBack={() => setSelectedSeller(null)}
          onToggleStatus={() => toggleSellerStatus(selectedSeller)}
          onVerify={() => verifySeller(selectedSeller)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
          <div className="overflow-auto h-full">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                  <th className="p-4 font-semibold text-gray-700">Reputación</th>
                  <th className="p-4 font-semibold text-gray-700">Ventas</th>
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
                      Cargando vendedores...
                    </td>
                  </tr>
                ) : filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No se encontraron vendedores
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {seller.seller_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{seller.seller_name}</p>
                            <p className="text-xs text-gray-500">{seller.email}</p>
                            {seller.is_verified && (
                              <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                                <CheckCircle className="w-3 h-3" /> Verificado
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {getReputationBadge(seller.reputation_level, seller.reputation_color)}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{seller.reputation_score}/100</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="font-medium">${seller.total_sales?.toLocaleString("es-AR")}</p>
                          <p className="text-xs text-gray-500">{seller.total_orders} órdenes</p>
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(seller.is_active)}</td>
                      <td className="p-4 text-gray-500 text-xs">
                        {new Date(seller.created_at).toLocaleDateString("es-AR")}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSeller(seller)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!seller.is_verified && (
                            <button
                              onClick={() => verifySeller(seller)}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Verificar vendedor"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => toggleSellerStatus(seller)}
                            className={`p-1.5 rounded transition-colors ${
                              seller.is_active
                                ? "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={seller.is_active ? "Suspender" : "Activar"}
                          >
                            {seller.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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

// Componente de detalle del vendedor
function SellerDetail({ 
  seller, 
  onBack, 
  onToggleStatus,
  onVerify 
}: { 
  seller: Seller
  onBack: () => void
  onToggleStatus: () => void
  onVerify: () => void
}) {
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"info" | "products" | "orders">("info")

  useEffect(() => {
    fetchSellerData()
  }, [seller.id])

  const fetchSellerData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("id, title, price, status, created_at, sold_count")
        .eq("seller_id", seller.user_id)
        .order("created_at", { ascending: false })
        .limit(10)

      // Fetch orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, total, status, created_at, buyer:buyer_id(email)")
        .eq("seller_id", seller.user_id)
        .order("created_at", { ascending: false })
        .limit(10)

      setProducts(productsData || [])
      setOrders(ordersData || [])
    } catch (error) {
      console.error("Error fetching seller data:", error)
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
          <div className="bg-blue-100 p-2 rounded-md">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{seller.seller_name}</h3>
            <p className="text-xs text-gray-500">{seller.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!seller.is_verified && (
            <button
              onClick={onVerify}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              <UserCheck className="w-4 h-4" />
              Verificar
            </button>
          )}
          <button
            onClick={onToggleStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium ${
              seller.is_active
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {seller.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {seller.is_active ? "Suspender" : "Activar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        {[
          { id: "info", label: "Información", icon: Store },
          { id: "products", label: "Productos", icon: Package },
          { id: "orders", label: "Órdenes", icon: TrendingUp },
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
              <h4 className="font-semibold text-gray-900">Datos del Vendedor</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-gray-900">{seller.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{seller.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Teléfono:</span>
                  <span className="text-gray-900">{seller.phone || "No especificado"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Registro:</span>
                  <span className="text-gray-900">{new Date(seller.created_at).toLocaleDateString("es-AR")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Estado:</span>
                  <span className={seller.is_active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {seller.is_active ? "Activo" : "Suspendido"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Verificado:</span>
                  <span className={seller.is_verified ? "text-blue-600 font-medium" : "text-gray-500"}>
                    {seller.is_verified ? "Sí" : "No"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Métricas</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Reputación</p>
                  <p className="text-2xl font-bold text-blue-900">{seller.reputation_score}/100</p>
                  <p className="text-xs text-blue-700">{seller.reputation_level}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Ventas Totales</p>
                  <p className="text-2xl font-bold text-green-900">${seller.total_sales?.toLocaleString("es-AR")}</p>
                  <p className="text-xs text-green-700">{seller.total_orders} órdenes</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Productos</p>
                  <p className="text-2xl font-bold text-purple-900">{seller.products_count || 0}</p>
                  <p className="text-xs text-purple-700">publicaciones activas</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-xs text-orange-600 mb-1">Tasa de Devolución</p>
                  <p className="text-2xl font-bold text-orange-900">{seller.return_rate || 0}%</p>
                  <p className="text-xs text-orange-700">últimos 30 días</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === "products" ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Últimos Productos</h4>
            {products.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay productos publicados</p>
            ) : (
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.title}</p>
                      <p className="text-xs text-gray-500">${product.price?.toLocaleString("es-AR")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {product.status}
                      </span>
                      <span className="text-xs text-gray-500">{product.sold_count || 0} vendidos</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Últimas Órdenes</h4>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay órdenes registradas</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Orden #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{order.buyer?.email}</p>
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
