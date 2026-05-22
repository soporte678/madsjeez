"use client";

import {
  BarChart3,
  Bot,
  HelpCircle,
  LayoutDashboard,
  MessageCircle,
  Package,
  Settings,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { WaNavId } from "./types";

const NAV: { id: WaNavId; label: string; icon: typeof MessageCircle; badge?: boolean }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "conversaciones", label: "Conversaciones", icon: MessageCircle, badge: true },
  { id: "contactos", label: "Contactos", icon: Users },
  { id: "automatizaciones", label: "Automatizaciones", icon: Zap },
  { id: "catalogo", label: "Catálogo", icon: Package },
  { id: "campanas", label: "Campañas", icon: Sparkles },
  { id: "metricas", label: "Métricas", icon: BarChart3 },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

type Props = {
  activeNav: WaNavId;
  conversationCount: number;
  onNavigate: (id: WaNavId) => void;
  children: ReactNode;
};

export default function WhatsappBotLayout({
  activeNav,
  conversationCount,
  onNavigate,
  children,
}: Props) {
  function handleNav(id: WaNavId) {
    onNavigate(id);
  }

  return (
    <div className="wa-layout">
      <aside className="wa-sidebar">
        <div className="wa-sidebar-brand">
          <div className="wa-sidebar-logo">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="wa-sidebar-title">Bot de WhatsApp</p>
            <p className="wa-sidebar-sub">CRM + IA · Evolution</p>
          </div>
        </div>

        <nav className="wa-sidebar-nav">
          {NAV.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              className={`wa-nav-item ${activeNav === id ? "wa-nav-item--active" : ""}`}
              onClick={() => handleNav(id)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" />
              <span className="flex-1 text-left">{label}</span>
              {badge && conversationCount > 0 ? (
                <span className="wa-nav-badge">{conversationCount > 99 ? "99+" : conversationCount}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <footer className="wa-sidebar-footer">
          <div className="wa-plan-pill">
            <span className="wa-plan-dot" />
            Plan vendedor
          </div>
          <button type="button" className="wa-footer-link" onClick={() => toast.info("Centro de ayuda próximamente")}>
            <HelpCircle className="h-3.5 w-3.5" />
            Ayuda
          </button>
          <button type="button" className="wa-footer-link" onClick={() => toast.info("Abrí tu tienda desde el menú principal")}>
            <Store className="h-3.5 w-3.5" />
            Mi tienda
          </button>
        </footer>
      </aside>

      <div className="wa-main">{children}</div>
    </div>
  );
}
