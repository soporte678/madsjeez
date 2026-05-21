"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Activity,
  CreditCard,
  FlaskConical,
  ImageOff,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Megaphone,
  Package,
  PackageX,
  RefreshCcw,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  Store,
  Truck,
  UserCheck,
  Users,
  X,
  Zap,
  Bell,
  ChevronDown,
  ChevronRight,
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
      { id: "flash-logistica", label: "Flash (envíos)", icon: Zap, href: "/admin/flash" },
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
      { id: "flash-campanas", label: "Campañas Flash", icon: Zap, href: "/admin/campanas" },
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

export function AdminLayoutClient({
  children,
  user: propUser,
  role: propRole,
  adminUser: propAdminUser,
}: AdminLayoutClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications] = useState(3)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    menuGroups.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
  )

  const user = propUser || { id: "", email: "", user_metadata: {} }
  const role = propRole || null
  const adminUser = propAdminUser || { id: "", first_name: "", last_name: "" }

  useEffect(() => {
    let disposed = false

    const refreshAdminSession = async () => {
      try {
        const response = await fetch("/api/admin/auth/status", {
          credentials: "include",
          cache: "no-store",
        })

        if (!disposed && response.status === 401) {
          router.replace("/admin/login")
          router.refresh()
        }
      } catch {
        // preserve current UI on transient failures
      }
    }

    refreshAdminSession()
    const intervalId = window.setInterval(refreshAdminSession, 5 * 60 * 1000)

    const handleVisibility = () => {
      if (!document.hidden) refreshAdminSession()
    }

    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault()
        document.getElementById("omnibox")?.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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

  const activeModule = pathname.replace("/admin", "").replace("/", "") || "dashboard"
  const isLoginPage = pathname === "/admin/login"

  const displayName =
    adminUser.first_name && adminUser.last_name
      ? `${adminUser.first_name} ${adminUser.last_name}`
      : user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin"

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (isLoginPage) return <>{children}</>

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <aside
        className={`hidden flex-col bg-slate-900 text-slate-300 shadow-2xl transition-all duration-300 md:flex ${
          isSidebarOpen ? "w-[280px]" : "w-[70px]"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-yellow-400 bg-[#FFF159] px-4">
          <div className={`flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#2D3277] ${!isSidebarOpen && "hidden"}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2D3277] text-sm text-white shadow-inner">
              MQ
            </div>
            <span className="truncate">MadsJeez</span>
            <span className="text-xs font-light opacity-80">ERP</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded p-1 text-[#2D3277] transition-colors hover:bg-yellow-300"
          >
            <Menu size={20} />
          </button>
        </div>

        <div className={`flex shrink-0 items-center border-b border-slate-800 bg-slate-950 p-4 ${!isSidebarOpen && "justify-center"}`}>
          <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-600 font-bold text-white shadow-lg">
            {adminUser.avatar_url ? (
              <img src={adminUser.avatar_url} alt="" className="h-full w-full rounded object-cover" />
            ) : (
              initials
            )}
          </div>
          {isSidebarOpen ? (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {role?.name || "Admin"} Nivel {role?.level || 1}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto py-2">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-2">
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors hover:text-slate-300"
                >
                  {group.title}
                  {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="px-2 py-1">
                  <div className="my-2 h-px bg-slate-700" />
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
                        className={`flex w-full items-center rounded-md text-sm transition-all ${
                          isSidebarOpen ? "px-3 py-2" : "justify-center px-2 py-2"
                        } ${
                          isActive
                            ? "bg-blue-600 font-medium text-white shadow-md"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <item.icon
                          size={18}
                          className={`${isSidebarOpen ? "mr-3" : ""} ${isActive ? "text-white" : "text-slate-500"}`}
                        />
                        {isSidebarOpen ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-4">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-md text-slate-400 transition-all hover:bg-slate-800 hover:text-white ${
              isSidebarOpen ? "px-3 py-2" : "justify-center px-2 py-2"
            }`}
            title={!isSidebarOpen ? "Cerrar sesión" : undefined}
          >
            <LogOut size={18} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen ? <span className="text-sm">Cerrar sesión</span> : null}
          </button>
        </div>
      </aside>

      {isMobileMenuOpen ? (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-slate-900 text-slate-300 shadow-2xl md:hidden">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-yellow-400 bg-[#FFF159] px-4">
              <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#2D3277]">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2D3277] text-sm text-white shadow-inner">MQ</div>
                <span>MadsJeez</span>
                <span className="text-xs font-light opacity-80">ERP</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#2D3277]">
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    {group.title}
                    {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {expandedGroups[group.title] ? (
                    <div className="mt-1 space-y-0.5 px-2">
                      {group.items.map((item) => {
                        const isActive = activeModule === item.id || pathname === item.href
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-all ${
                              isActive
                                ? "bg-blue-600 font-medium text-white"
                                : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <item.icon size={16} className={`mr-3 ${isActive ? "text-white" : "text-slate-500"}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
            <div className="border-t border-slate-800 p-4">
              <button onClick={handleLogout} className="flex w-full items-center rounded-md px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <LogOut size={18} className="mr-3" />
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-950">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 shadow-sm backdrop-blur md:px-6">
          <div className="flex max-w-3xl flex-1 items-center">
            <button className="mr-3 text-slate-300 md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" size={18} />
              <input
                id="omnibox"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchQuery.trim()) {
                    router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
                  }
                }}
                placeholder="Omnibox: Buscar por ID de orden, usuario, tracking... (Ctrl+K)"
                className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
              />
              <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-[10px] font-bold text-slate-500 md:flex">
                <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5">CTRL</span>
                <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5">K</span>
              </div>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-3">
            <button className="relative hidden rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-900 hover:text-white sm:block">
              <Bell size={20} />
              {notifications > 0 ? (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-slate-950 bg-red-500" />
              ) : null}
            </button>
            <div className="hidden h-6 w-px bg-slate-800 sm:block" />
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="hidden sm:inline">Operativo</span>
            </div>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-auto bg-slate-950 p-4 md:p-6 lg:p-8">
          <div className="mx-auto h-full max-w-[1600px]">{children}</div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  )
}
