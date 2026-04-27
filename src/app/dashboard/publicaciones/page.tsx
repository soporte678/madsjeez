"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, Filter, ChevronDown, MoreVertical, Eye, 
  ShoppingCart, Package, TrendingUp, AlertCircle,
  CheckCircle, Clock, Zap, Star, MessageSquare,
  Edit, Trash2, Pause, Play, BarChart3, Tag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Datos de ejemplo para publicaciones
const publicacionesData = [
  {
    id: 1,
    titulo: "Kit de pistón de cilindro de 32mm for cortasetos Shindaiwa",
    imagen: "https://images.unsplash.com/photo-1586671263448-b3a8228f1a7b?auto=format&fit=crop&w=100&q=80",
    precio: 45999,
    condicion: "Nuevo",
    vendidos: 12,
    visitas: 234,
    calidad: "Buena",
    experiencia: "Positiva",
    estado: "activo",
    recomendaciones: "1 objetivo",
    envioGratis: true,
    preguntas: 2,
    rating: 4.5
  },
  {
    id: 2,
    titulo: "Cilindro, Piston Y Aros Kit 58cc (45mm) P/motosierras Chinas",
    imagen: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=100&q=80",
    precio: 69999,
    condicion: "Nuevo",
    vendidos: 8,
    visitas: 156,
    calidad: "Excelente",
    experiencia: "Muy positiva",
    estado: "activo",
    recomendaciones: "Bien hecho",
    envioGratis: true,
    preguntas: 0,
    rating: 4.8
  },
  {
    id: 3,
    titulo: "Batería Lithium 20V 4Ah para herramientas eléctricas",
    imagen: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80",
    precio: 35999,
    condicion: "Reacondicionado",
    vendidos: 25,
    visitas: 412,
    calidad: "Regular",
    experiencia: "Mejorar",
    estado: "pausado",
    recomendaciones: "PERDIENDO",
    envioGratis: false,
    preguntas: 5,
    rating: 3.2
  }
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(value)
}

export default function PublicacionesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("gestion")
  const [publicaciones, setPublicaciones] = useState(publicacionesData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?redirect=/dashboard/publicaciones")
    }
  }, [status, router])

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
    { id: "gestion", label: "Gestión de publicaciones" },
    { id: "promociones", label: "Central de promociones" },
    { id: "precios", label: "Gestión de precios" },
    { id: "stock", label: "Gestión de stock Full" }
  ]

  const calidadColors: Record<string, string> = {
    "Excelente": "text-green-600 bg-green-50",
    "Buena": "text-blue-600 bg-blue-50",
    "Regular": "text-yellow-600 bg-yellow-50",
    "Mala": "text-red-600 bg-red-50"
  }

  const experienciaColors: Record<string, string> = {
    "Muy positiva": "text-green-600 bg-green-50",
    "Positiva": "text-blue-600 bg-blue-50",
    "Neutral": "text-gray-600 bg-gray-50",
    "Mejorar": "text-orange-600 bg-orange-50",
    "Negativa": "text-red-600 bg-red-50"
  }

  const estadoColors: Record<string, string> = {
    "activo": "text-green-600 bg-green-50",
    "pausado": "text-yellow-600 bg-yellow-50",
    "finalizado": "text-gray-600 bg-gray-50"
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header - Reutilizar del dashboard */}
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
        
        {/* Sidebar - Componente unificado del dashboard */}
        <aside className="w-56 flex-shrink-0">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <span className="grid grid-cols-2 gap-0.5"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span><span className="w-2 h-2 bg-blue-500 rounded-sm"></span></span>
            MI CUENTA
          </h2>
          <nav className="flex flex-col gap-1">
            <div className="mb-2">
              <button className="w-full flex items-center justify-between py-2 px-3 hover:bg-blue-50 rounded-lg text-blue-600 font-semibold transition-colors">
                <div className="flex items-center gap-3">
                  <Tag size={18} /> 
                  <span>Ventas</span>
                </div>
                <ChevronDown size={16} className="transform rotate-180" />
              </button>
              <div className="flex flex-col ml-9 mt-1 border-l-2 border-gray-200 pl-4 gap-2">
                <Link href="/dashboard" className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900">
                  Resumen
                </Link>
                <Link href="/dashboard/novedades" className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900">
                  Novedades
                </Link>
                <Link href="/dashboard/publicaciones" className="text-left text-sm py-1.5 transition-colors text-blue-600 font-bold">
                  Publicaciones
                </Link>
                <Link href="/dashboard/preguntas" className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900">
                  Preguntas
                </Link>
                <Link href="/dashboard/ventas" className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900">
                  Ventas
                </Link>
                <Link href="/dashboard/reputacion" className="text-left text-sm py-1.5 transition-colors text-gray-500 hover:text-gray-900">
                  Reputación
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {/* Banner Promocional */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 mb-8 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Zap size={16} className="text-yellow-200" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">EVENTO EXCLUSIVO</span>
                </div>
                <h3 className="font-black text-2xl leading-tight mb-2">¡Vivo en YouTube! Rompé récords en Hot Sale</h3>
                <p className="text-[14px] opacity-90 mb-4">Potenciá tus ventas y alcanzá nuevos récords.</p>
                <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-black text-[12px] uppercase tracking-widest hover:bg-gray-100 transition-colors">
                  Ver más
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              </div>
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

          {/* Tarjetas de Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Pendientes por corregir</h3>
                  <p className="text-sm text-gray-500">2 publicaciones</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">Ver detalles</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Para ganar la competencia</h3>
                  <p className="text-sm text-gray-500">5 sugerencias</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">Mejorar</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Para volver a vender</h3>
                  <p className="text-sm text-gray-500">3 productos</p>
                </div>
              </div>
              <button className="text-blue-600 text-sm font-medium hover:underline">Reactivar</button>
            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por título, código o SKU"
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                <Filter size={20} />
                Filtrar y ordenar
              </button>
            </div>
          </div>

          {/* Tabla de Publicaciones */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">
                  {publicaciones.length} publicaciones
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit size={16} className="mr-2" />
                    Editar seleccionadas
                  </Button>
                  <Button variant="outline" size="sm">
                    <Pause size={16} className="mr-2" />
                    Pausar
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Publicación
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Condiciones
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibe
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Métricas últ. 7 días
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calidad
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experiencia
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado y recomendaciones
                    </th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {publicaciones.map((pub) => (
                    <tr key={pub.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={pub.imagen}
                            alt={pub.titulo}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {pub.titulo}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {pub.envioGratis && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                  Envío gratis
                                </span>
                              )}
                              {pub.preguntas > 0 && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  {pub.preguntas} preguntas
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(pub.precio)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-gray-600">{pub.condicion}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          <div>{pub.vendidos} vendidos</div>
                          <div className="text-xs text-gray-400">{pub.visitas} visitas</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Eye size={14} />
                            {pub.visitas}
                          </div>
                          <div className="flex items-center gap-1">
                            <ShoppingCart size={14} />
                            {pub.vendidos}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={calidadColors[pub.calidad]}>
                          {pub.calidad}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={experienciaColors[pub.experiencia]}>
                          {pub.experiencia}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <Badge className={estadoColors[pub.estado]}>
                            {pub.estado}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {pub.recomendaciones}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <BarChart3 size={16} />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit size={16} />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
