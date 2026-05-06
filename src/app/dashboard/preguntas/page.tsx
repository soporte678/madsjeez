"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, Filter, MessageSquare, Clock, CheckCircle, 
  ShoppingCart, User, LayoutGrid, ChevronRight, Star,
  Send, AlertCircle, TrendingUp, Package, MoreVertical,
  Eye, Heart, Share2, ExternalLink
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Datos de ejemplo de preguntas
const preguntasData = [
  {
    id: 1,
    producto: {
      id: 1,
      titulo: "Kit de pistón de cilindro de 32mm for cortasetos Shindaiwa DH230 C230",
      imagen: "https://images.unsplash.com/photo-1586671263448-b3a8228f1a7b?auto=format&fit=crop&w=100&q=80",
      precio: 45999,
      vendedor: "HerramientasPro SA",
      envioGratis: true,
      rating: 4.5
    },
    pregunta: "¿Este kit es compatible con el modelo DH230?",
    fecha: new Date("2024-04-20T14:30:00"),
    respondida: true,
    respuesta: "Sí, este kit es 100% compatible con el modelo DH230. Incluye todos los componentes necesarios para la instalación.",
    fechaRespuesta: new Date("2024-04-20T16:45:00"),
    calificacion: null
  },
  {
    id: 2,
    producto: {
      id: 2,
      titulo: "Cilindro, Piston Y Aros Kit 58cc (45mm) P/motosierras Chinas",
      imagen: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=100&q=80",
      precio: 69999,
      vendedor: "TechStore Official",
      envioGratis: true,
      rating: 4.8
    },
    pregunta: "¿Tienen stock para envío inmediato?",
    fecha: new Date("2024-04-22T09:15:00"),
    respondida: false,
    respuesta: null,
    fechaRespuesta: null,
    calificacion: null
  },
  {
    id: 3,
    producto: {
      id: 3,
      titulo: "Smartphone 128GB 5G Cámara Dual",
      imagen: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80",
      precio: 320000,
      vendedor: "TechMobile Store",
      envioGratis: true,
      rating: 4.6
    },
    pregunta: "¿El teléfono viene con cargador y cable incluidos?",
    fecha: new Date("2024-04-18T11:20:00"),
    respondida: true,
    respuesta: "Sí, incluye cargador rápido de 65W, cable USB-C y manual de instrucciones en la caja.",
    fechaRespuesta: new Date("2024-04-18T13:30:00"),
    calificacion: 5
  },
  {
    id: 4,
    producto: {
      id: 4,
      titulo: "Zapatillas Running Pro Aerodinámicas",
      imagen: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=100&q=80",
      precio: 85000,
      vendedor: "SportLife Store",
      envioGratis: false,
      rating: 4.3
    },
    pregunta: "¿Qué talles tienen disponibles?",
    fecha: new Date("2024-04-21T16:45:00"),
    respondida: true,
    respuesta: "Actualmente tenemos disponibles los talles 38, 40, 42 y 44. Podés consultar disponibilidad de otros talles.",
    fechaRespuesta: new Date("2024-04-21T18:00:00"),
    calificacion: 4
  }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value)
}

const sidebarMenu = [
  { id: "compras", label: "Compras", icon: ShoppingCart, sub: ["Compras", "Preguntas", "Opiniones", "Favoritos"] },
  { id: "ventas", label: "Ventas", icon: MessageSquare, sub: ["Resumen", "Novedades", "Publicaciones", "Preguntas", "Ventas"] },
  { id: "perfil", label: "Mi perfil", icon: User, sub: ["Mis datos", "Seguridad"] },
]

export default function PreguntasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeMenu, setActiveMenu] = useState("compras")
  const [activeTab, setActiveTab] = useState("recibidas")
  const [searchQuery, setSearchQuery] = useState("")
  const [preguntas, setPreguntas] = useState(preguntasData)
  const [selectedPregunta, setSelectedPregunta] = useState<typeof preguntasData[0] | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/preguntas")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const tabs = [
    { id: "recibidas", label: "Recibidas", count: preguntasData.filter(p => !p.respondida).length },
    { id: "respondidas", label: "Respondidas", count: preguntasData.filter(p => p.respondida).length },
    { id: "todas", label: "Todas", count: preguntasData.length }
  ]

  const filteredPreguntas = preguntas.filter(pregunta => {
    const matchesSearch = pregunta.producto.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pregunta.pregunta.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (activeTab === "recibidas") return !pregunta.respondida && matchesSearch
    if (activeTab === "respondidas") return pregunta.respondida && matchesSearch
    return matchesSearch
  })

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "hace unos minutos"
    if (diffInHours < 24) return `hace ${diffInHours} horas`
    if (diffInHours < 48) return "ayer"
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header - Igual que otras páginas */}
      <header className="bg-white border-b border-border pt-3 pb-2 px-4 shadow-md sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-6 md:gap-12">
            <Link href="/" className="flex items-center gap-4 cursor-pointer group flex-shrink-0">
              <div className="relative w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-transparent"></div>
                <svg viewBox="0 0 100 100" className="w-8 h-8 overflow-visible">
                  <path d="M 15 80 L 35 30 L 55 55" stroke="#2563EB" fill="none" strokeWidth="15" strokeLinecap="round"/>
                  <path d="M 85 80 L 65 30 L 45 65" stroke="#3B82F6" fill="none" strokeWidth="15" strokeLinecap="round"/>
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
                          href={s === "Preguntas" ? "/dashboard/preguntas" : "#"}
                          className={`text-left py-2 px-3 text-[13px] font-medium transition-all ${
                            s === "Preguntas" ? "text-blue-600 bg-blue-50/50" : "text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
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
          {/* Header de Preguntas */}
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">Preguntas</h1>
            
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
              <div className="flex border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {tab.count}
                      </span>
                    )}
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
                    placeholder="Buscar preguntas"
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

          {/* Lista de Preguntas */}
          {filteredPreguntas.length > 0 ? (
            <div className="space-y-4">
              {filteredPreguntas.map((pregunta) => (
                <div key={pregunta.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header de la pregunta */}
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={pregunta.producto.imagen}
                        alt={pregunta.producto.titulo}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                          {pregunta.producto.titulo}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                          <span>Vendido por: <strong>{pregunta.producto.vendedor}</strong></span>
                          <span>•</span>
                          <span>{formatCurrency(pregunta.producto.precio)}</span>
                          {pregunta.producto.envioGratis && (
                            <span className="text-green-600 font-medium">Envío gratis</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={i < Math.floor(pregunta.producto.rating) ? "text-primary fill-primary" : "text-gray-300"}
                              />
                            ))}
                            <span className="ml-1 text-sm text-gray-600">({pregunta.producto.rating})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs text-gray-500">{formatDate(pregunta.fecha)}</span>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical size={16} className="text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Pregunta */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium mb-1">{pregunta.pregunta}</p>
                          <p className="text-xs text-gray-500">Pregunta realizada {formatDate(pregunta.fecha)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Respuesta */}
                    {pregunta.respondida ? (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={16} className="text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 mb-1">{pregunta.respuesta}</p>
                            <p className="text-xs text-gray-500">Respondida {formatDate(pregunta.fechaRespuesta!)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle size={20} className="text-primary" />
                          <span className="text-primary font-medium">Esperando respuesta del vendedor</span>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Eye size={16} />
                          <span className="text-sm">Ver producto</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Heart size={16} />
                          <span className="text-sm">Agregar a favoritos</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Share2 size={16} />
                          <span className="text-sm">Compartir</span>
                        </button>
                      </div>
                      
                      {pregunta.respondida && !pregunta.calificacion && (
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary-hover transition-colors">
                          <Star size={16} />
                          Calificar respuesta
                        </button>
                      )}
                      
                      {pregunta.respondida && pregunta.calificacion && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Calificaste:</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < pregunta.calificacion ? "text-primary fill-primary" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Estado vacío
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === "recibidas" && "No tenés preguntas pendientes"}
                {activeTab === "respondidas" && "No tenés preguntas respondidas"}
                {activeTab === "todas" && "No tenés preguntas"}
              </h2>
              <p className="text-gray-500 mb-6">
                {activeTab === "recibidas" && "Cuando recibas preguntas de compradores, aparecerán aquí"}
                {activeTab === "respondidas" && "Tus preguntas respondidas aparecerán aquí"}
                {activeTab === "todas" && "Cuando hagas o recibas preguntas, aparecerán aquí"}
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Explorar productos
              </Link>
            </div>
          )}

          {/* Estadísticas */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Total preguntas</h3>
              <p className="text-2xl font-bold text-gray-900">{preguntasData.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Pendientes</h3>
              <p className="text-2xl font-bold text-gray-900">{preguntasData.filter(p => !p.respondida).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Respondidas</h3>
              <p className="text-2xl font-bold text-gray-900">{preguntasData.filter(p => p.respondida).length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Calificación promedio</h3>
              <p className="text-2xl font-bold text-gray-900">
                {preguntasData.filter(p => p.calificacion).length > 0 
                  ? (preguntasData.filter(p => p.calificacion).reduce((acc, p) => acc + p.calificacion!, 0) / preguntasData.filter(p => p.calificacion).length).toFixed(1)
                  : "N/A"
                }
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
