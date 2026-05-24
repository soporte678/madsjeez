"use client"

import "@/styles/admin-theme.css"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { AdminNavbar } from "@/components/admin/AdminNavbar"
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle"
import {
  getStoredAdminTheme,
  storeAdminTheme,
  type AdminTheme,
} from "@/lib/admin-theme"
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
  Settings,
  Sparkles,
  ShieldAlert,
  Smartphone,
  Store,
  Truck,
  UserCheck,
  Users,
  X,
  Zap,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

const AtlasVoiceWidget = dynamic(
  () => import("@/components/admin/atlas/AtlasVoiceWidget").then((m) => m.AtlasVoiceWidget),
  { ssr: false }
)

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
      { id: "jarvis", label: "Jarvis Orchestrator", icon: Sparkles, href: "/admin/jarvis" },
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    menuGroups.reduce((acc, group) => ({ ...acc, [group.title]: true }), {})
  )
  const [voiceWidgetOpen, setVoiceWidgetOpen] = useState(false);
  const [adminTheme, setAdminTheme] = useState<AdminTheme>("dark")

  useEffect(() => {
    setAdminTheme(getStoredAdminTheme())
  }, [])

  const handleThemeChange = (theme: AdminTheme) => {
    setAdminTheme(theme)
    storeAdminTheme(theme)
  }

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
    <div
      data-admin-theme={adminTheme}
      className="admin-root flex h-screen flex-col overflow-hidden font-sans"
      style={{ background: "var(--admin-bg)", color: "var(--admin-text)" }}
    >
      <AdminNavbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
      <aside
        className={`hidden flex-col shadow-2xl transition-all duration-300 md:flex ${
          isSidebarOpen ? "w-[280px]" : "w-[70px]"
        }`}
        style={{
          background: "var(--admin-sidebar-bg)",
          color: "var(--admin-sidebar-text)",
          borderRight: "1px solid var(--admin-border)",
        }}
      >
        <div
          className="flex h-12 shrink-0 items-center justify-between border-b px-3"
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface-raised)" }}
        >
          {isSidebarOpen ? (
            <span className="truncate text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-muted)" }}>
              Menú admin
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded p-1.5 transition-colors"
            style={{ color: "var(--admin-text-muted)" }}
            aria-label={isSidebarOpen ? "Contraer menú" : "Expandir menú"}
          >
            <Menu size={20} />
          </button>
        </div>

        <div
          className={`flex shrink-0 items-center border-b p-4 ${!isSidebarOpen && "justify-center"}`}
          style={{ borderColor: "var(--admin-border)", background: "var(--admin-bg)" }}
        >
          <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded bg-blue-600 font-bold text-white shadow-lg">
            {adminUser.avatar_url ? (
              <img src={adminUser.avatar_url} alt="" className="h-full w-full rounded object-cover" />
            ) : (
              initials
            )}
          </div>
          {isSidebarOpen ? (
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold" style={{ color: "var(--admin-text)" }}>
                {displayName}
              </p>
              <p
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--admin-accent)" }}
              >
                {role?.name || "Admin"} Nivel {role?.level || 1}
              </p>
            </div>
          ) : null}
        </div>

        <nav className="admin-scrollbar custom-scrollbar flex-1 overflow-y-auto py-2">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-2">
              {isSidebarOpen ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
                  style={{ color: "var(--admin-sidebar-muted)" }}
                >
                  {group.title}
                  {expandedGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="px-2 py-1">
                  <div className="my-2 h-px" style={{ background: "var(--admin-border)" }} />
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
                        } ${isActive ? "font-medium text-white shadow-md" : ""}`}
                        style={
                          isActive
                            ? { background: "var(--admin-nav-active)", color: "#fff" }
                            : {
                                color: "var(--admin-sidebar-muted)",
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = "var(--admin-hover)"
                            e.currentTarget.style.color = "var(--admin-text)"
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.background = ""
                            e.currentTarget.style.color = "var(--admin-sidebar-muted)"
                          }
                        }}
                        title={!isSidebarOpen ? item.label : undefined}
                      >
                        <span
                          className={isSidebarOpen ? "mr-3 inline-flex" : "inline-flex"}
                          style={{ color: isActive ? "#fff" : "var(--admin-sidebar-muted)" }}
                        >
                          <item.icon size={18} />
                        </span>
                        {isSidebarOpen ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t p-4" style={{ borderColor: "var(--admin-border)" }}>
          <button
            onClick={handleLogout}
            className={`flex w-full items-center rounded-md transition-all ${
              isSidebarOpen ? "px-3 py-2" : "justify-center px-2 py-2"
            }`}
            style={{ color: "var(--admin-sidebar-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--admin-hover)"
              e.currentTarget.style.color = "var(--admin-text)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = ""
              e.currentTarget.style.color = "var(--admin-sidebar-muted)"
            }}
            title={!isSidebarOpen ? "Cerrar sesión" : undefined}
          >
            <LogOut size={18} className={isSidebarOpen ? "mr-3" : ""} />
            {isSidebarOpen ? <span className="text-sm">Cerrar sesión</span> : null}
          </button>
        </div>
      </aside>

      {isMobileMenuOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm md:hidden"
            style={{ background: "color-mix(in srgb, var(--admin-sidebar-bg) 85%, transparent)" }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col shadow-2xl md:hidden"
            style={{
              background: "var(--admin-sidebar-bg)",
              color: "var(--admin-sidebar-text)",
            }}
          >
            <div
              className="flex h-12 shrink-0 items-center justify-between border-b px-4"
              style={{ borderColor: "var(--admin-border)", background: "var(--admin-surface-raised)" }}
            >
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--admin-text-muted)" }}>
                Menú admin
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ color: "var(--admin-text-muted)" }}
                aria-label="Cerrar menú"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
              {menuGroups.map((group) => (
                <div key={group.title} className="mb-4">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--admin-sidebar-muted)" }}
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
                              isActive ? "font-medium text-white" : ""
                            }`}
                            style={
                              isActive
                                ? { background: "var(--admin-nav-active)", color: "#fff" }
                                : { color: "var(--admin-sidebar-muted)" }
                            }
                          >
                            <span
                              className="mr-3 inline-flex"
                              style={{ color: isActive ? "#fff" : "var(--admin-sidebar-muted)" }}
                            >
                              <item.icon size={16} />
                            </span>
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
            <div className="border-t p-4" style={{ borderColor: "var(--admin-border)" }}>
              <button
                onClick={handleLogout}
                className="flex w-full items-center rounded-md px-3 py-2"
                style={{ color: "var(--admin-sidebar-muted)" }}
              >
                <LogOut size={18} className="mr-3" />
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </>
      ) : null}

      <main
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ background: "var(--admin-bg)" }}
      >
        <header
          className="z-10 flex h-12 shrink-0 items-center justify-between border-b px-4 md:px-6"
          style={{
            borderColor: "var(--admin-border)",
            background: "var(--admin-header-bg)",
          }}
        >
          <button
            type="button"
            className="rounded-md p-2 md:hidden"
            style={{ color: "var(--admin-text-muted)" }}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <p className="hidden text-sm font-semibold md:block" style={{ color: "var(--admin-text-muted)" }}>
            Backoffice MadsJeez
          </p>
          <div className="ml-auto flex items-center gap-3">
            <AdminThemeToggle theme={adminTheme} onChange={handleThemeChange} />
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-300">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="hidden sm:inline">Operativo</span>
            </div>
          </div>
        </header>

        <div
          className="admin-scrollbar custom-scrollbar flex-1 overflow-auto p-4 md:p-6 lg:p-8"
          style={{ background: "var(--admin-bg)" }}
        >
          <div className="mx-auto h-full max-w-[1600px]">{children}</div>
        </div>
      </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { border-radius: 10px; }
      `}</style>

      {!isLoginPage ? (
        <AtlasVoiceWidget
          variant="floating"
          open={voiceWidgetOpen}
          onOpenChange={setVoiceWidgetOpen}
        />
      ) : null}
    </div>
  )
}
