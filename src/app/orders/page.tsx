"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Package, Clock, CheckCircle, Truck, Search,
  ShoppingCart, MessageSquare, User,
  LayoutGrid, Settings,
  ChevronRight, Filter, Download
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type ApiOrder = {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      title: string
      images: Array<{ url: string }>
      seller?: { name: string } | null
    }
  }>
  shipment?: {
    trackingNumber: string | null
    status: string
  } | null
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value)
}

function mapOrderStatus(status: string): string {
  const m: Record<string, string> = {
    PENDING: "Pendiente",
    PAID: "Pagado",
    PROCESSING: "En preparación",
    SHIPPED: "En camino",
    DELIVERED: "Entregado",
    CANCELLED: "Cancelado",
    REFUNDED: "Reembolsado",
  }
  return m[status] ?? status
}

function isActiveOrderStatus(status: string): boolean {
  return !["DELIVERED", "CANCELLED", "REFUNDED"].includes(status)
}

const sidebarMenu = [
  { id: "compras", label: "Compras", icon: ShoppingCart, sub: ["Compras", "Preguntas", "Opiniones", "Favoritos"] },
  { id: "perfil", label: "Mi perfil", icon: User, sub: ["Mis datos", "Seguridad"] },
  { id: "configuracion", label: "Configuración", icon: Settings, sub: ["Notificaciones", "Privacidad"] },
]

export default function OrdersPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState("compras")
  const [activeTab, setActiveTab] = useState("todas")
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/orders")
    }
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return

    let cancelled = false
    ;(async () => {
      setLoadingOrders(true)
      try {
        const res = await fetch("/api/orders", { credentials: "include" })
        const data = await res.json().catch(() => [])
        if (!res.ok) {
          toast.error(data.error || "No se pudieron cargar las compras")
          return
        }
        if (!cancelled) setOrders(Array.isArray(data) ? data : [])
      } catch {
        toast.error("No se pudieron cargar las compras")
      } finally {
        if (!cancelled) setLoadingOrders(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [status])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin h-8 w-8 border-4 border-[#3483FA] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const tabs = [
    { id: "todas", label: "Todas" },
    { id: "activas", label: "Activas" },
    { id: "finalizadas", label: "Finalizadas" },
    { id: "canceladas", label: "Canceladas" }
  ]

  const estadoColors: Record<string, string> = {
    PENDING: "text-amber-600 bg-amber-50",
    PAID: "text-blue-600 bg-blue-50",
    PROCESSING: "text-yellow-600 bg-yellow-50",
    SHIPPED: "text-blue-600 bg-blue-50",
    DELIVERED: "text-green-600 bg-green-50",
    CANCELLED: "text-red-600 bg-red-50",
    REFUNDED: "text-gray-600 bg-gray-50",
  }

  const filteredCompras = orders
    .filter((order) => {
      if (activeTab === "activas") return isActiveOrderStatus(order.status)
      if (activeTab === "finalizadas") return order.status === "DELIVERED"
      if (activeTab === "canceladas") return ["CANCELLED", "REFUNDED"].includes(order.status)
      return true
    })
    .filter((order) => {
      const q = searchQuery.trim().toLowerCase()
      if (!q) return true
      if (order.orderNumber.toLowerCase().includes(q)) return true
      return order.items.some((it) => it.product.title.toLowerCase().includes(q))
    })

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header - Igual que otras páginas */}
      <header className="bg-[#FEE500] pt-3 pb-2 px-4 shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-6 md:gap-12">
            <Link href="/" className="flex items-center gap-4 cursor-pointer group flex-shrink-0">
              <div className="relative w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent"></div>
                <svg viewBox="0 0 100 100" className="w-8 h-8 overflow-visible">
                  <path d="M 15 80 L 35 30 L 55 55" stroke="#2563EB" fill="none" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M 85 80 L 65 30 L 45 65" stroke="#FACC15" fill="none" strokeWidth="15" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-black text-[22px] tracking-tighter leading-none uppercase text-slate-900">
                MADSJEEZ
              </span>
            </Link>

            <div className="flex-1 max-w-3xl relative group">
              <input 
                type="text" 
                placeholder="Buscar productos, marcas y más..." 
                className="w-full py-2.5 px-5 pr-12 rounded shadow-sm bg-white focus:ring-2 focus:ring-blue-600/20 transition-all outline-none text-slate-700 font-medium text-[15px]" 
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer border-l border-slate-100 ml-2 pl-3 group-focus-within:text-blue-600">
                <Search size={18} className="text-slate-400" />
              </div>
            </div>

            <div className="flex items-center gap-5 font-semibold text-slate-800 text-sm">
              <div className="flex items-center gap-2 cursor-pointer hover:text-blue-700 transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-xs font-bold">MJ</span>
                </div>
                <span className="hidden lg:block">Madsjeez</span>
              </div>
              <button className="hidden lg:block hover:text-blue-700">Ayuda</button>
              <button className="hidden lg:block hover:text-blue-700">Asistente</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-full mx-auto flex relative">
        
        {/* Sidebar Left */}
        <aside className="w-72 bg-white min-h-[calc(100vh-110px)] border-r border-slate-200 sticky top-[110px] hidden md:block flex-shrink-0">
          <div className="p-6">
            <h2 className="text-lg font-black uppercase mb-8 flex items-center gap-3 text-slate-800">
              <LayoutGrid size={22} className="text-blue-600" /> Mi cuenta
            </h2>
            <nav className="flex flex-col gap-1">
              {sidebarMenu.map((item) => (
                <div key={item.id} className="mb-1">
                  <button
                    onClick={() => setActiveMenu(activeMenu === item.id ? "" : item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      activeMenu === item.id ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={activeMenu === item.id ? 2.5 : 2} />
                      <span className="font-bold text-[14px]">{item.label}</span>
                    </div>
                    <ChevronRight size={14} className={`transition-transform duration-300 ${activeMenu === item.id ? "rotate-90" : ""}`} />
                  </button>
                  {activeMenu === item.id && (
                    <div className="flex flex-col ml-10 mt-1 border-l-2 border-blue-100">
                      {item.sub.map((s) => (
                        <Link 
                          key={s} 
                          href={s === "Compras" ? "/orders" : s === "Favoritos" ? "/favorites" : "#"}
                          className={`text-left py-2 px-3 text-[13px] font-medium transition-all ${
                            s === "Compras" ? "text-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                          }`}
                        >
                          {s}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Header de Compras */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">Compras</h1>
            
            {/* Gestión de Colaboradores Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">Gestioná tus colaboradores</h3>
                    <p className="text-sm text-blue-700">Autorizá a otras personas a comprar en tu nombre</p>
                  </div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Gestionar
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de búsqueda */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar compras"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Filter size={20} />
                  Filtrar
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Compras */}
          {loadingOrders ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-10 w-10 border-4 border-[#3483FA] border-t-transparent rounded-full" />
            </div>
          ) : filteredCompras.length > 0 ? (
            <div className="space-y-6">
              {filteredCompras.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={estadoColors[order.status] ?? "text-gray-600 bg-gray-50"}>
                        {mapOrderStatus(order.status)}
                      </Badge>
                    </div>

                    {order.shipment?.trackingNumber && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-gray-400" />
                          <span className="text-gray-600">
                            Seguimiento: <strong>{order.shipment.trackingNumber}</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {order.items.map((item) => {
                        const img = item.product.images?.[0]?.url
                        const sellerName = item.product.seller?.name ?? "Vendedor"
                        const lineTotal = item.price * item.quantity
                        return (
                          <div key={item.id} className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                              {img ? (
                                <img
                                  src={img}
                                  alt={item.product.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {item.product.title}
                              </h4>
                              <p className="text-sm text-gray-500">Vendido por: {sellerName}</p>
                              <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-gray-900">{formatCurrency(lineTotal)}</p>
                              <Badge className={estadoColors[order.status] ?? ""} variant="outline">
                                {mapOrderStatus(order.status)}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Total (
                            {order.items.reduce((acc, p) => acc + p.quantity, 0)}{" "}
                            productos)
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {order.status === "SHIPPED" && (
                            <button
                              type="button"
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                              <Truck size={16} />
                              Seguir envío
                            </button>
                          )}
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <MessageSquare size={16} />
                            Contactar vendedor
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <Download size={16} />
                            Descargar factura
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No tenés compras en esta sección
              </h2>
              <p className="text-gray-500 mb-6">
                {activeTab === "activas" && "No tenés compras activas en este momento"}
                {activeTab === "finalizadas" && "No tenés compras finalizadas aún"}
                {activeTab === "canceladas" && "No tenés compras canceladas"}
                {activeTab === "todas" && "Cuando hagas tu primera compra, aparecerá aquí"}
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Explorar productos
              </Link>
            </div>
          )}

          {/* Info de estados */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">En preparación</h3>
              <p className="text-sm text-gray-500">El vendedor está preparando tu pedido</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Listo para enviar</h3>
              <p className="text-sm text-gray-500">Tu pedido está listo para ser despachado</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">En camino</h3>
              <p className="text-sm text-gray-500">Tu pedido está siendo entregado</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Entregado</h3>
              <p className="text-sm text-gray-500">Tu pedido fue entregado con éxito</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
