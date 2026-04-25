"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  LayoutGrid, ShoppingCart, Zap, Megaphone, FileText, 
  Wallet, User, Settings, ChevronDown, Star, TrendingUp,
  MoreVertical, MessageSquare, ChevronRight, ShieldCheck,
  Bell, Search, MapPin, Sparkles, Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sidebarMenu = [
  { id: "compras", label: "Compras", icon: ShoppingCart, sub: ["Compras", "Preguntas", "Opiniones", "Favoritos"] },
  { id: "ventas", label: "Ventas", icon: Zap, sub: ["Resumen", "Novedades", "Publicaciones", "Preguntas", "Ventas", "Posventa", "Envíos Full", "Métricas", "Reputación"] },
  { id: "marketing", label: "Marketing", icon: Megaphone, sub: ["Central de marketing", "Publicidad", "Promociones"] },
  { id: "facturacion", label: "Facturación", icon: FileText, sub: ["Tarifas y pagos", "Facturador"] },
  { id: "prestamos", label: "Préstamos", icon: Wallet, sub: ["Créditos"] },
  { id: "perfil", label: "Mi perfil", icon: User, sub: ["Mis datos", "Seguridad"] },
  { id: "configuracion", label: "Configuración", icon: Settings, sub: ["Ventas", "Colaboradores"] },
]

export default function DashboardPage() {
  const [activeMenu, setActiveMenu] = useState("ventas")
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-slate-900">
      {/* Header */}
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
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
                  <User size={18} />
                </div>
                <span className="hidden lg:block">MaqJeez II</span>
              </div>
              <button className="hidden lg:block hover:text-blue-700">Ayuda</button>
              <div className="relative cursor-pointer">
                <Bell size={20} />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full">2</span>
              </div>
              <Link href="/cart">
                <ShoppingCart size={20} className="cursor-pointer" />
              </Link>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[13px] font-medium text-slate-800/80 pb-1">
            <div className="flex items-center gap-1 cursor-pointer">
              <MapPin size={16} /> Enviar a Carlos Spegazzini 1812
            </div>
            <div className="hidden md:flex gap-6">
              {["Categorías", "Ofertas", "Cupones", "Supermercado", "Moda", "Vender"].map((l) => (
                <Link key={l} href={`/${l.toLowerCase()}`} className="hover:text-blue-700 cursor-pointer">{l}</Link>
              ))}
            </div>
            <div className="flex items-center gap-4 text-slate-900 font-bold italic">
              <Sparkles size={14} className="text-blue-700" /> MADSJEEZ PRO
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - 3 Columns */}
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
                    <ChevronDown size={14} className={`transition-transform duration-300 ${activeMenu === item.id ? "rotate-180" : ""}`} />
                  </button>
                  {activeMenu === item.id && (
                    <div className="flex flex-col ml-10 mt-1 border-l-2 border-blue-100">
                      {item.sub.map((s) => (
                        <button key={s} className="text-left py-2 px-3 text-[13px] text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all font-medium">
                          {s}
                        </button>
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
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Resumen</h1>
            <div className="flex gap-3">
              <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">Configurar</button>
              <button className="text-blue-600 font-bold text-sm">+ Crear vista</button>
            </div>
          </div>

          {/* Metrics Top */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tu reputación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-black text-emerald-600 uppercase">Vendedor Líder</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div className="h-1.5 w-full flex gap-0.5 rounded overflow-hidden mb-2">
                  <div className="flex-1 bg-red-200 opacity-30"></div>
                  <div className="flex-1 bg-orange-200 opacity-30"></div>
                  <div className="flex-1 bg-yellow-200 opacity-30"></div>
                  <div className="flex-1 bg-lime-300"></div>
                  <div className="flex-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Desempeño Logístico</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Envíos Flash</span>
                    <span className="text-sm font-black text-emerald-600">EXCELENTE</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Colecta</span>
                    <span className="text-sm font-black text-blue-600">NORMAL</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Items */}
          <Card className="mb-8">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-[12px] font-black uppercase tracking-widest text-slate-500">Pendientes en tus publicaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-50">
                {[
                  { label: "Preguntas", value: "Sin pendientes", alert: false },
                  { label: "Publicaciones por mejorar", value: "55 pendientes", alert: true },
                  { label: "Gestión de envíos Full", value: "25 productos", alert: true },
                  { label: "Precios competitivos", value: "382 sugerencias", alert: true },
                ].map((p, i) => (
                  <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">{p.label}</span>
                      <span className={`text-[13px] font-medium ${p.alert ? "text-red-500" : "text-slate-400"}`}>{p.value}</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Sidebar Right */}
        <aside className="w-80 bg-white min-h-[calc(100vh-110px)] border-l border-slate-200 sticky top-[110px] hidden xl:block p-6 flex-shrink-0">
          <div className="space-y-8">
            
            {/* MADS Play Widget */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <Star size={16} className="text-yellow-400" fill="currentColor" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Novedades</span>
                </div>
                <h4 className="font-black text-lg leading-tight mb-2 italic uppercase tracking-tighter">¡Rompé récords!</h4>
                <p className="text-[12px] opacity-70 mb-4 leading-relaxed">Vendenos tus mejores productos en el próximo Flash Sale.</p>
                <button className="w-full py-2 bg-yellow-400 text-slate-900 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-white transition-colors">
                  Ver MADS Play
                </button>
              </div>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            </div>

            {/* Billing */}
            <div className="border-b border-slate-100 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Facturación</h4>
                <MoreVertical size={14} className="text-slate-300" />
              </div>
              <div className="text-2xl font-black text-slate-800">$ 1.110.798,62</div>
              <p className="text-[11px] text-slate-400 font-bold mt-1">Saldo a pagar al 10 de Mayo</p>
              <button className="mt-4 text-xs font-black text-blue-600 hover:underline">Ir a pagar factura</button>
            </div>

            {/* Advertising Metrics */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Publicidad</h4>
                <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-slate-800">72</div>
                <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-black flex items-center gap-1">
                  <ChevronRight size={10} className="-rotate-90" /> 500%
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-bold mt-1 uppercase">Ventas por publicidad</p>
              <button className="mt-4 text-xs font-black text-blue-600 hover:underline">Ir a métricas de publicidad</button>
            </div>
          </div>
        </aside>

        {/* Floating Action Button */}
        <div className="fixed bottom-8 right-8 z-[200]">
          <button className="w-14 h-14 bg-blue-600 rounded-full shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all group">
            <div className="absolute -top-12 right-0 bg-white text-slate-800 px-4 py-2 rounded-xl text-[12px] font-black shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-tighter">
              ¿En qué puedo ayudarte?
            </div>
            <MessageSquare size={26} fill="currentColor" className="opacity-90" />
            <div className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-10 pb-8 border-t-[8px] border-yellow-400 bg-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 text-[12px] font-bold text-slate-500 mb-8 border-b border-slate-200 pb-6">
            {["Trabajá con nosotros", "Términos y condiciones", "Privacidad", "Accesibilidad", "Información financiera", "Ayuda", "Defensa del Consumidor"].map((l) => (
              <Link key={l} href="#" className="hover:text-slate-900 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-[11px] text-slate-400 font-bold">
            <div className="flex flex-col gap-1">
              <span>© 2026 MADSJEEZ COMMERCE GROUP S.R.L.</span>
              <span>Carlos Spegazzini, Buenos Aires, ARGENTINA.</span>
            </div>
            <div className="flex gap-4 items-center">
              <span className="text-slate-900 bg-slate-100 px-3 py-1 rounded">DATA FISCAL</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <ShieldCheck size={16} />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
