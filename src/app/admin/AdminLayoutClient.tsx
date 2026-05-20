"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  DollarSign,
  Search,
  Settings,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Eye,
  Filter,
  Download,
  Zap,
  Inbox,
  TrendingUp,
  Activity,
  Package,
  Store,
  Ban,
  PauseCircle,
  ShieldAlert,
  CreditCard,
  FileText,
  Lock,
  Truck,
  Scale,
  RefreshCcw,
  ImageOff,
  MessageCircle,
  Megaphone,
  Smartphone,
  PowerOff,
  ChevronDown,
  ChevronRight,
  PackageX,
  UserCheck,
  LogOut,
  Menu,
  X,
  FlaskConical
} from "lucide-react"

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard General", icon: LayoutDashboard, href: "/admin" },
      { id: "vendedores", label: "Vendedores y Reputación", icon: Store, href: "/admin/vendedores" },
      { id: "compradores", label: "Compradores", icon: Users, href: "/admin/compradores" },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { id: "fraude", label: "Control de Estafas", icon: ShieldAlert, href: "/admin/fraude" },
      { id: "kyc", label: "Nuevas Cuentas (KYC)", icon: UserCheck, href: "/admin/kyc" },
    ],
  },
  {
    title: "Logística",
    items: [
      { id: "envios", label: "Radar de Envíos / Demoras", icon: Truck, href: "/admin/envios" },
      { id: "siniestros", label: "Siniestros", icon: PackageX, href: "/admin/siniestros" },
    ],
  },
  {
    title: "Resolución",
    items: [
      { id: "mediaciones", label: "Mediaciones y Reclamos", icon: Scale, href: "/admin/mediaciones" },
      { id: "devoluciones", label: "Devoluciones", icon: RefreshCcw, href: "/admin/devoluciones" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { id: "publicaciones", label: "Publicaciones Activas", icon: Package, href: "/admin/publicaciones" },
      { id: "imagenes", label: "Cola Imágenes Incorrectas", icon: ImageOff, href: "/admin/imagenes" },
    ],
  },
  {
    title: "CX y Soporte",
    items: [
      { id: "mensajes", label: "Preguntas y Mensajes", icon: MessageCircle, href: "/admin/mensajes" },
      { id: "consultas", label: "Consultas Generales", icon: Inbox, href: "/admin/consultas" },
      { id: "whatsapp", label: "WhatsApp Business", icon: Smartphone, href: "/admin/whatsapp" },
      { id: "whatsapp-test", label: "Test WhatsApp API", icon: FlaskConical, href: "/admin/whatsapp-test" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { id: "flash", label: "Campañas Flash", icon: Zap, href: "/admin/campanas" },
      { id: "publicidad", label: "Publicidad (Ads)", icon: Megaphone, href: "/admin/publicidad" },
      { id: "leads", label: "Leads Vendedores", icon: Store, href: "/admin/leads" },
      { id: "suscripciones", label: "Suscripciones", icon: CreditCard, href: "/admin/suscripciones" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { id: "errores", label: "Errores (Logs)", icon: Activity, href: "/admin/logs" },
      { id: "config", label: "Configuración", icon: Settings, href: "/admin/configuracion" },
    ],
  },
]

interface AdminLayoutClientProps {
  children: React.ReactNode
  user?: {
    id: string
    email?: string
    user_metadata?: { name?: string; full_name?: string }
  }
  role?: {
    id: string
    name: string
    level: number
    permissions: string[]
  } | null
  adminUser?: {
    id: string
    first_name: string
    last_name: string
    avatar_url?: string
  }
}

export function AdminLayoutClient({ children, user: propUser, role: propRole, adminUser: propAdminUser }: AdminLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Use props or default values
  const user = propUser || { id: "", email: "", user_metadata: {} }
  const role = propRole || null
  const adminUser = propAdminUser || { id: "", first_name: "", last_name: "" }
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    menuGroups.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState(3)

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth/sign-out", {
      method: "POST",
      credentials: "include",
    }).catch(() => {})
    router.push("/admin/login")
    router.refresh()
  }

  const getActiveModule = () => {
    const path = pathname.replace("/admin", "").replace("/", "") || "dashboard"
    return path
  }

  const activeModule = getActiveModule()

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        document.getElementById("omnibox")?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const hasPermission = (permission: string) => {
    if (!propRole) return false
    if (propRole.level >= 5) return true // SuperAdmin
    return propRole.permissions?.includes(permission) || false
  }

  const displayName = propAdminUser?.first_name && propAdminUser?.last_name 
    ? `${propAdminUser.first_name} ${propAdminUser.last_name}`
    : propUser?.user_metadata?.name || propUser?.user_metadata?.full_name || propUser?.email?.split("@")[0] || "Admin"

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  // Don't render sidebar on login page
  const isLoginPage = pathname === "/admin/login"
  
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans text-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ${
          isSidebarOpen ? "w-[280px]" : "w-[70px]"
        } shadow-2xl`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 bg-[#FFF159] border-b border-yellow-400 shrink-0">
          <div className={`font-extrabold text-[#2D3277] text-lg tracking-tight flex items-center gap-2 ${!isSidebarOpen && "hidden"}`}>
            <div className="w-8 h-8 bg-[#2D3277] rounded text-white flex items-center justify-center text-sm shadow-inner">
              MQ
            </div>
            <span className="truncate">MadsJeez</span>
            <span className="font-light text-xs opacity-80">ERP</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-[#2D3277] p-1 hover:bg-yellow-300 rounded transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Profile */}
        <div className={`p-4 border-b border-slate-800 bg-slate-950 shrink-0 flex items-center ${!isSidebarOpen && "justify-center"}`}>
          <div className="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center font-bold mr-3 shadow-lg shrink-0">
            {propAdminUser?.avatar_url ? (
              <img src={propAdminUser.avatar_url} alt="" className="w-full h-full rounded object-cover" />
            ) : (
              initials
            )}
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                {propRole?.name || "Admin"} Nivel {propRole?.level || 1}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="mb-2">
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
                >
                  {group.title}
                  {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="px-2 py-1">
                  <div className="h-px bg-slate-700 my-2" />
                </div>
              )}

              {(!isSidebarOpen || expandedGroups[group.title]) && (
                <div className={`space-y-0.5 ${isSidebarOpen ? "px-2" : "px-1"}`}>
                  {group.items.map((item) => {
                    const isActive = activeModule === item.id || pathname === item.href
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`w-full flex items-center rounded-md text-sm transition-all ${
                          isSidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"
                        } ${
                          isActive
                            ? "bg-blue-600 text-white font-medium shadow-md"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <item.icon
                          size={18}
                          className={`${isSidebarOpen ? "mr-3" : ""} ${isActive ? "text-white" : "text-slate-500"}`}
                        />
                        {isSidebarOpen && <span className="truncate">{item.label}</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-all ${
              isSidebarOpen ? "px-3 py-2" : "px-2 py-2 justify-center"
            }`}
            title={!isSidebarOpen ? "Cerrar sesión" : undefined}
          >
            <LogOut size={18} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen && <span className="text-sm">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-slate-900/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-900 text-slate-300 flex flex-col shadow-2xl md:hidden">
            <div className="h-16 flex items-center justify-between px-4 bg-[#FFF159] border-b border-yellow-400 shrink-0">
              <div className="font-extrabold text-[#2D3277] text-lg tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-[#2D3277] rounded text-white flex items-center justify-center text-sm shadow-inner">MQ</div>
                <span>MadsJeez</span>
                <span className="font-light text-xs opacity-80">ERP</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#2D3277]">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="mb-4">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest"
                  >
                    {group.title}
                    {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandedGroups[group.title] && (
                    <div className="mt-1 space-y-0.5 px-2">
                      {group.items.map((item) => {
                        const isActive = activeModule === item.id
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-all ${
                              isActive
                                ? "bg-blue-600 text-white font-medium"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <item.icon size={16} className={`mr-3 ${isActive ? "text-white" : "text-slate-500"}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md">
                <LogOut size={18} className="mr-3" />
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6] overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center flex-1 max-w-3xl">
            <button className="mr-3 md:hidden text-gray-600" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="omnibox"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
                placeholder="Omnibox: Buscar por ID de orden, usuario, tracking... (Ctrl+K)"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-lg text-sm outline-none transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                <span className="bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">CTRL</span>
                <span className="bg-gray-200 px-1.5 py-0.5 rounded border border-gray-300">K</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
              <Bell size={20} />
              {notifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-bold border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">Operativo</span>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto h-full">{children}</div>
        </div>
      </main>

      {/* Custom CSS */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  )
}
