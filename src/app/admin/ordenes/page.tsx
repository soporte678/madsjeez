"use client"

import { useState, useEffect } from "react"
import {
  ShoppingCart,
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  DollarSign,
  CreditCard,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Order {
  id: string
  buyer_id: string
  buyer_name: string
  buyer_email: string
  seller_id: string
  seller_name: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
  payment_status: "pending" | "paid" | "failed" | "refunded"
  shipping_address: any
  items: any[]
  created_at: string
  updated_at: string
}

export default function OrdenesPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "processing" | "shipped" | "delivered" | "cancelled">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const itemsPerPage = 20

  useEffect(() => {
    fetchOrders()
  }, [filter, currentPage])

  const fetchOrders = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      let query = supabase
        .from("orders")
        .select("*, buyer:buyer_id(name, email), seller:seller_id(name)", { count: "exact" })

      if (filter !== "all") query = query.eq("status", filter)

      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      const formattedOrders: Order[] = data?.map((o: any) => ({
        id: o.id,
        buyer_id: o.buyer_id,
        buyer_name: o.buyer?.name || "Sin nombre",
        buyer_email: o.buyer?.email || "",
        seller_id: o.seller_id,
        seller_name: o.seller?.name || "Sin nombre",
        total: o.total,
        status: o.status || "pending",
        payment_status: o.payment_status || "pending",
        shipping_address: o.shipping_address || {},
        items: o.items || [],
        created_at: o.created_at,
        updated_at: o.updated_at,
      })) || []

      setOrders(formattedOrders)
      setTotalCount(count || 0)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast.error("Error al cargar órdenes")
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId)

      if (error) throw error

      toast.success(`Orden marcada como: ${status}`)
      fetchOrders()
    } catch (error) {
      console.error("Error updating order:", error)
      toast.error("Error al actualizar orden")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      refunded: "bg-gray-100 text-gray-800 border-gray-200",
    }
    const labels: Record<string, string> = {
      pending: "Pendiente",
      processing: "Procesando",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
      refunded: "Reembolsado",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    }
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[status] || colors.pending}`}>
        {status === "paid" ? "Pagado" : status === "pending" ? "Pendiente" : status === "failed" ? "Fallido" : status}
      </span>
    )
  }

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.buyer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.seller_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const totalRevenue = orders.filter(o => o.status !== "cancelled" && o.status !== "refunded").reduce((acc, o) => acc + o.total, 0)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Gestión de Órdenes
          </h2>
          <p className="text-sm text-gray-500">{totalCount} órdenes | ${totalRevenue.toLocaleString()} en ventas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
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
            placeholder="Buscar por ID, comprador, vendedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value as any); setCurrentPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="processing">Procesando</option>
          <option value="shipped">Enviados</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: "Pendientes", value: orders.filter(o => o.status === "pending").length, color: "yellow" },
          { label: "En Proceso", value: orders.filter(o => ["processing", "shipped"].includes(o.status)).length, color: "blue" },
          { label: "Entregados", value: orders.filter(o => o.status === "delivered").length, color: "green" },
          { label: "Ingresos", value: `$${totalRevenue.toLocaleString()}`, color: "purple" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-lg border`}>
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex-1 overflow-hidden">
        <div className="overflow-auto h-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold text-gray-700">Orden</th>
                <th className="p-4 font-semibold text-gray-700">Comprador</th>
                <th className="p-4 font-semibold text-gray-700">Vendedor</th>
                <th className="p-4 font-semibold text-gray-700">Total</th>
                <th className="p-4 font-semibold text-gray-700">Estado</th>
                <th className="p-4 font-semibold text-gray-700">Pago</th>
                <th className="p-4 font-semibold text-gray-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay órdenes</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString("es-AR")}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.buyer_name}</p>
                        <p className="text-xs text-gray-500">{order.buyer_email}</p>
                      </div>
                    </td>
                    <td className="p-4">{order.seller_name}</td>
                    <td className="p-4 font-medium">${order.total.toLocaleString("es-AR")}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
                    <td className="p-4">{getPaymentBadge(order.payment_status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === "pending" && (
                          <>
                            <button onClick={() => updateOrderStatus(order.id, "processing")} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Procesar">
                              <Package className="w-4 h-4" />
                            </button>
                            <button onClick={() => updateOrderStatus(order.id, "cancelled")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {order.status === "processing" && (
                          <button onClick={() => updateOrderStatus(order.id, "shipped")} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Marcar enviado">
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === "shipped" && (
                          <button onClick={() => updateOrderStatus(order.id, "delivered")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Marcar entregado">
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Página {currentPage} de {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Anterior</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Orden #{selectedOrder.id.slice(0, 8)}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Estado:</span> {getStatusBadge(selectedOrder.status)}</div>
                <div><span className="text-gray-500">Pago:</span> {getPaymentBadge(selectedOrder.payment_status)}</div>
                <div><span className="text-gray-500">Comprador:</span> {selectedOrder.buyer_name}</div>
                <div><span className="text-gray-500">Vendedor:</span> {selectedOrder.seller_name}</div>
                <div><span className="text-gray-500">Total:</span> <span className="font-bold">${selectedOrder.total.toLocaleString()}</span></div>
                <div><span className="text-gray-500">Fecha:</span> {new Date(selectedOrder.created_at).toLocaleString("es-AR")}</div>
              </div>
              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Dirección de envío:</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                  </p>
                </div>
              )}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2">Items:</p>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{item.product_title || item.title} x{item.quantity}</span>
                        <span className="font-medium">${item.price?.toLocaleString()}</span>
                      </div>
                    ))}
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
