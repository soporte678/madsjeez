"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag,
  Tag,
  Megaphone,
  FileText,
  Settings,
  User,
  HelpCircle,
  Home,
  ShoppingCart,
  Bell,
  Zap,
  Store,
  ChevronDown,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";
import { UserMenu } from "@/components/dashboard/UserMenu";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import RainbowLogo from "@/components/brand/RainbowLogo";
import ThemeToneSwitcher from "@/components/theme/ThemeToneSwitcher";

/* ------------------------------------------------------------------ */
/*  Tipos                                                              */
/* ------------------------------------------------------------------ */

interface SubItem {
  id: string;
  label: string;
  href: string;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string; // solo para items directos (Perfil, Ayuda)
  subItems?: SubItem[];
}

/* ------------------------------------------------------------------ */
/*  Estructura del menu                                                */
/* ------------------------------------------------------------------ */

const MENU_GROUPS: MenuGroup[] = [
  {
    id: "compras-group",
    label: "Compras",
    icon: <ShoppingBag size={18} />,
    subItems: [
      { id: "compras", label: "Compras", href: "/dashboard/compras" },
      { id: "carrito", label: "Carrito", href: "/dashboard/carrito" },
      { id: "preguntas-compras", label: "Preguntas", href: "/dashboard/preguntas" },
      { id: "opiniones", label: "Opiniones", href: "/dashboard/opiniones" },
      { id: "favoritos", label: "Favoritos", href: "/dashboard/favoritos" },
      { id: "tiendas-sigo", label: "Tiendas que sigo", href: "/dashboard/tiendas-sigo" },
      { id: "vehiculos-interes", label: "Vehiculos de interes", href: "/dashboard/vehiculos-interes" },
      { id: "inmuebles-interes", label: "Inmuebles de interes", href: "/dashboard/inmuebles-interes" },
      { id: "busquedas-guardadas", label: "Busquedas guardadas", href: "/dashboard/busquedas-guardadas" },
    ],
  },
  {
    id: "ventas-group",
    label: "Ventas",
    icon: <Tag size={18} />,
    subItems: [
      { id: "resumen", label: "Resumen", href: "/dashboard/resumen" },
      { id: "ventas-novedades", label: "Novedades", href: "/dashboard/ventas-novedades" },
      { id: "publicaciones", label: "Publicaciones", href: "/dashboard/publicaciones" },
      { id: "mi-tienda", label: "Mi tienda publica", href: "/dashboard/mi-tienda" },
      { id: "meli-sync", label: "Mercado Libre", href: "/dashboard/meli-sync" },
      { id: "preguntas-ventas", label: "Preguntas", href: "/dashboard/preguntas" },
      { id: "ventas-lista", label: "Ventas", href: "/dashboard/ventas-lista" },
      { id: "posventa", label: "Posventa", href: "/dashboard/posventa" },
      { id: "metricas", label: "Metricas", href: "/dashboard/metricas" },
      { id: "reputacion", label: "Reputacion", href: "/dashboard/reputacion" },
      { id: "productos-catalogo", label: "Productos de catalogo", href: "/dashboard/productos-catalogo" },
      { id: "preferencias-venta", label: "Preferencias de venta", href: "/dashboard/preferencias-venta" },
      { id: "central-aprendizaje", label: "Central de aprendizaje", href: "/dashboard/central-aprendizaje" },
    ],
  },
  {
    id: "marketing-group",
    label: "Marketing",
    icon: <Megaphone size={18} />,
    subItems: [
      { id: "marketing-ia", label: "Marketing IA (beta)", href: "/dashboard/marketing-ia" },
      { id: "whatsapp-bot", label: "Bot de WhatsApp", href: "/dashboard/whatsapp-bot" },
      { id: "meli-ads-studio", label: "Mercado Libre Ads", href: "/dashboard/meli-ads-studio" },
      { id: "central-marketing", label: "Central de marketing", href: "/dashboard/central-marketing" },
      { id: "publicidad", label: "Publicidad", href: "/dashboard/publicidad" },
      { id: "promociones", label: "Promociones", href: "/dashboard/promociones" },
      { id: "clips", label: "Clips", href: "/dashboard/clips" },
      { id: "mi-pagina", label: "Mi pagina", href: "/dashboard/mi-pagina" },
      { id: "canal-difusion", label: "Canal de difusion", href: "/dashboard/canal-difusion" },
    ],
  },
  {
    id: "facturacion-group",
    label: "Facturacion",
    icon: <FileText size={18} />,
    subItems: [
      { id: "tarifas-pagos", label: "Tarifas y pagos", href: "/dashboard/tarifas-pagos" },
      { id: "facturacion", label: "Facturacion", href: "/dashboard/facturacion" },
    ],
  },
  {
    id: "perfil",
    label: "Mi perfil",
    icon: <User size={18} />,
    href: "/dashboard/perfil",
  },
  {
    id: "configuracion-group",
    label: "Configuracion",
    icon: <Settings size={18} />,
    subItems: [
      { id: "mis-marcas", label: "Mis marcas", href: "/dashboard/mis-marcas" },
      { id: "colaboradores", label: "Colaboradores", href: "/dashboard/colaboradores" },
    ],
  },
  {
    id: "ayuda",
    label: "Ayuda",
    icon: <HelpCircle size={18} />,
    href: "/dashboard/ayuda",
  },
];

/* ------------------------------------------------------------------ */
/*  Accesos rapidos                                                    */
/* ------------------------------------------------------------------ */

const QUICK_LINKS = [
  { label: "Ir a la tienda", href: "/", icon: <Home size={16} className="shrink-0 opacity-70" /> },
  { label: "Carrito publico", href: "/cart", icon: <ShoppingCart size={16} className="shrink-0 opacity-70" /> },
  { label: "Notificaciones", href: "/notifications", icon: <Bell size={16} className="shrink-0 opacity-70" /> },
  { label: "Planes MADS+", href: "/subscriptions", icon: <Zap size={16} className="shrink-0 opacity-70" /> },
  { label: "Herramientas para vender", href: "/seller/register", icon: <Store size={16} className="shrink-0 opacity-70" /> },
];

/* ------------------------------------------------------------------ */
/*  Componente principal : DashboardLayout                             */
/* ------------------------------------------------------------------ */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /* -- Estado : grupos colapsables ----------------------------------- */
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  /* -- Estado : sidebar mobile --------------------------------------- */
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* -- Estado : menus desplegables ----------------------------------- */
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  /* -- Estado : usuario ---------------------------------------------- */
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    image: string | null;
  } | null>(null);

  /* -- Fetch usuario ------------------------------------------------- */
  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.email) setCurrentUser(data);
      })
      .catch(() => {});
  }, []);

  /* -- Abrir grupo automaticamente si la ruta activa esta dentro ---- */
  useEffect(() => {
    MENU_GROUPS.forEach((group) => {
      if (group.subItems) {
        const isActiveInGroup = group.subItems.some(
          (sub) => pathname === sub.href
        );
        if (isActiveInGroup) {
          setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        }
      }
    });
  }, [pathname]);

  /* -- Helpers ------------------------------------------------------- */
  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const isSubItemActive = useCallback(
    (href: string) => pathname === href,
    [pathname]
  );

  const userData = {
    name: currentUser?.name || "MadsJeez | Repues...",
    email: currentUser?.email || "",
    image: currentUser?.image || null,
  };

  /* -- Render : item directo (sin sub-items) ------------------------- */
  const renderDirectItem = (item: MenuGroup) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.id}
        href={item.href!}
        onClick={() => setMobileSidebarOpen(false)}
        className={`w-full flex items-center justify-between py-2 px-4 font-medium transition-colors text-sm rounded-md ${
          active
            ? "bg-[var(--shell-sidebar-active-bg)] text-primary shadow-sm"
            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-3">
          {item.icon || <LayoutGrid size={18} />}
          {item.label}
        </div>
      </Link>
    );
  };

  /* -- Render : grupo colapsable ------------------------------------- */
  const renderGroup = (group: MenuGroup) => {
    const isOpen = !!openGroups[group.id];
    return (
      <div key={group.id}>
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between py-2 px-4 hover:bg-primary/10 text-primary font-semibold transition-colors text-sm rounded-md"
        >
          <div className="flex items-center gap-3">
            {group.icon}
            {group.label}
          </div>
          <ChevronDown
            size={16}
            className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && group.subItems && (
          <div className="flex flex-col ml-4 mt-1 border-l-2 border-border/80 pl-4 gap-1">
            {group.subItems.map((sub) => {
              const active = isSubItemActive(sub.href);
              return (
                <Link
                  key={sub.id}
                  href={sub.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`text-left text-sm py-1.5 px-2 transition-colors flex items-center justify-between rounded-md ${
                    active
                      ? "text-primary font-bold bg-[var(--shell-sidebar-active-bg)] shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span>{sub.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* -- Cerrar sidebar al navegar en mobile --------------------------- */
  const handleMobileLinkClick = () => setMobileSidebarOpen(false);

  /* ================================================================= */
  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex flex-col relative">
      {/* ============================================================ */}
      {/*  NAVBAR SUPERIOR                                             */}
      {/* ============================================================ */}
      <header className="bg-[var(--shell-header-bg)] border-b border-[var(--shell-header-border)] py-2 px-4 shadow-sm z-50 relative flex-shrink-0 backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--shell-header-bg)_88%,transparent)]">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          {/* Logo + boton hamburguesa (mobile) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <RainbowLogo />
          </div>

          {/* Barra de navegacion derecha */}
          <div className="flex items-center gap-4 text-[13px] text-muted-foreground font-light bg-card/70 border border-border/60 rounded-full px-3 py-1.5">
            {/* Menu de usuario */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {currentUser?.image ? (
                  <img
                    src={currentUser.image}
                    alt={userData.name}
                    className="w-5 h-5 rounded-full object-cover border border-border"
                  />
                ) : (
                  <User size={16} />
                )}
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {userData.name}
                </span>
                <ChevronDown
                  size={12}
                  className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </button>
              <UserMenu
                isOpen={userMenuOpen}
                onClose={() => setUserMenuOpen(false)}
                userData={{
                  name: userData.name,
                  email: userData.email,
                  image: userData.image,
                }}
                onNavigate={(view) => {
                  // Las vistas del UserMenu aun usan strings;
                  // se mapean a rutas reales via window.location para
                  // mantener compatibilidad con el componente existente.
                  const routeMap: Record<string, string> = {
                    resumen: "/dashboard/resumen",
                    publicaciones: "/dashboard/publicaciones",
                    metricas: "/dashboard/metricas",
                    preguntas: "/dashboard/preguntas",
                    ventas: "/dashboard/ventas-lista",
                    perfil: "/dashboard/perfil",
                    ayuda: "/dashboard/ayuda",
                    configuracion: "/dashboard/mis-marcas",
                    compras: "/dashboard/compras",
                    favoritos: "/dashboard/favoritos",
                    reputacion: "/dashboard/reputacion",
                    marketing: "/dashboard/marketing-ia",
                    "mi-tienda": "/dashboard/mi-tienda",
                  };
                  const route = routeMap[view];
                  if (route) window.location.href = route;
                  setUserMenuOpen(false);
                }}
              />
            </div>

            {/* Links directos (desktop) */}
            <Link
              href="/dashboard/publicaciones"
              className="hover:text-foreground transition-colors hidden md:inline"
            >
              Vender
            </Link>
            <Link
              href="/dashboard/ayuda"
              className="hover:text-foreground transition-colors hidden md:inline"
            >
              Ayuda
            </Link>

            {/* Theme switcher */}
            <ThemeToneSwitcher compact />

            {/* Notificaciones */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative hover:text-foreground p-0.5 transition-colors"
              >
                <Bell size={18} />
              </button>
              <NotificationsDropdown
                isOpen={notifOpen}
                onClose={() => setNotifOpen(false)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  CONTENIDO PRINCIPAL : sidebar + area central                */}
      {/* ============================================================ */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* -------------------------------------------------------- */}
        {/*  SIDEBAR (desktop - fijo)                                */}
        {/* -------------------------------------------------------- */}
        <aside className="hidden lg:block w-56 flex-shrink-0 bg-card/95 border-r border-border shadow-[inset_-1px_0_0_var(--border)] overflow-y-auto">
          <SidebarContent
            onLinkClick={() => {}}
            renderDirectItem={renderDirectItem}
            renderGroup={renderGroup}
          />
        </aside>

        {/* -------------------------------------------------------- */}
        {/*  SIDEBAR (mobile - overlay drawer)                       */}
        {/* -------------------------------------------------------- */}
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 z-[60] lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Drawer */}
            <aside className="fixed top-0 left-0 h-full w-64 bg-card/95 border-r border-border shadow-[inset_-1px_0_0_var(--border)] z-[70] overflow-y-auto lg:hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-bold text-foreground">Menu</span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent
                onLinkClick={handleMobileLinkClick}
                renderDirectItem={renderDirectItem}
                renderGroup={renderGroup}
              />
            </aside>
          </>
        )}

        {/* -------------------------------------------------------- */}
        {/*  AREA CENTRAL (children de Next.js)                      */}
        {/* -------------------------------------------------------- */}
        <section className="flex-1 min-w-0 overflow-y-auto">
          <main className="p-6 lg:p-8">{children}</main>
        </section>
      </div>
    </div>
  );
}

/* =================================================================== */
/*  Sub-componente : SidebarContent                                    */
/*  Renderiza el menu + accesos rapidos. Se reutiliza para desktop    */
/*  y mobile.                                                          */
/* =================================================================== */

function SidebarContent({
  onLinkClick,
  renderDirectItem,
  renderGroup,
}: {
  onLinkClick: () => void;
  renderDirectItem: (item: MenuGroup) => React.ReactNode;
  renderGroup: (group: MenuGroup) => React.ReactNode;
}) {
  return (
    <div className="py-6 px-0">
      {/* Titulo */}
      <h2 className="font-bold text-lg mb-4 flex items-center gap-2 px-4 text-foreground">
        <span className="grid grid-cols-2 gap-0.5">
          <span className="w-2 h-2 bg-primary rounded-sm" />
          <span className="w-2 h-2 bg-primary rounded-sm" />
          <span className="w-2 h-2 bg-primary rounded-sm" />
          <span className="w-2 h-2 bg-primary rounded-sm" />
        </span>
        MI CUENTA
      </h2>

      {/* Menu de navegacion */}
      <nav className="flex flex-col gap-1">
        {MENU_GROUPS.map((item) =>
          item.subItems ? renderGroup(item) : renderDirectItem(item)
        )}
      </nav>

      {/* Accesos rapidos */}
      <div className="mt-6 px-4 pt-5 border-t border-border space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">
          Accesos rapidos (sitio)
        </p>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onLinkClick}
            className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
