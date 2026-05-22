/**
 * Secciones del panel vendedor/autogestionables para permisos de colaboradores.
 * Los `id` coinciden con los fragmentos / activeMenu del dashboard (`page.tsx`).
 */
export type CollaboratorSectionPermission = "read" | "rw";

export type CollaboratorSectionDef = {
  id: string;
  label: string;
  group: string;
};

export const COLLABORATOR_SECTIONS: CollaboratorSectionDef[] = [
  { id: "compras", label: "Compras", group: "Compras" },
  { id: "carrito", label: "Carrito", group: "Compras" },
  { id: "opiniones", label: "Opiniones", group: "Compras" },
  { id: "favoritos", label: "Favoritos", group: "Compras" },
  { id: "tiendas-sigo", label: "Tiendas que sigo", group: "Compras" },
  { id: "vehiculos-interes", label: "Vehículos de interés", group: "Compras" },
  { id: "inmuebles-interes", label: "Inmuebles de interés", group: "Compras" },
  { id: "busquedas-guardadas", label: "Búsquedas guardadas", group: "Compras" },

  { id: "resumen", label: "Resumen", group: "Ventas" },
  { id: "ventas-novedades", label: "Novedades", group: "Ventas" },
  { id: "preguntas", label: "Preguntas", group: "Ventas" },
  { id: "publicaciones", label: "Publicaciones", group: "Ventas" },
  { id: "meli-sync", label: "Mercado Libre", group: "Ventas" },
  { id: "ventas-lista", label: "Ventas", group: "Ventas" },
  { id: "posventa", label: "Posventa", group: "Ventas" },
  { id: "metricas", label: "Métricas", group: "Ventas" },
  { id: "reputacion", label: "Reputación", group: "Ventas" },
  { id: "productos-catalogo", label: "Productos de catálogo", group: "Ventas" },
  { id: "preferencias-venta", label: "Preferencias de venta", group: "Ventas" },
  { id: "central-aprendizaje", label: "Central de aprendizaje", group: "Ventas" },

  { id: "marketing-ia", label: "Marketing IA", group: "Marketing" },
  { id: "whatsapp-bot", label: "Bot de WhatsApp", group: "Marketing" },
  { id: "meli-ads-studio", label: "Mercado Libre Ads", group: "Marketing" },
  { id: "central-marketing", label: "Central de marketing", group: "Marketing" },
  { id: "publicidad", label: "Publicidad", group: "Marketing" },
  { id: "promociones", label: "Promociones", group: "Marketing" },
  { id: "clips", label: "Clips", group: "Marketing" },
  { id: "mi-pagina", label: "Mi página", group: "Marketing" },
  { id: "canal-difusion", label: "Canal de difusión", group: "Marketing" },

  { id: "tarifas-pagos", label: "Tarifas y pagos", group: "Facturación" },
  { id: "facturacion", label: "Facturación", group: "Facturación" },

  { id: "perfil", label: "Mi perfil", group: "Cuenta" },
  { id: "mis-marcas", label: "Mis marcas", group: "Configuración" },
  { id: "colaboradores", label: "Colaboradores", group: "Configuración" },
  { id: "ayuda", label: "Ayuda", group: "General" },
];

const ALLOWED_IDS = new Set(COLLABORATOR_SECTIONS.map((s) => s.id));

export function isValidSectionId(id: string): boolean {
  return ALLOWED_IDS.has(id);
}

/** Normaliza JSON de permisos entrantes: solo ids válidos y read | rw */
export function sanitizePermissionsMap(raw: unknown): Record<string, CollaboratorSectionPermission> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, CollaboratorSectionPermission> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidSectionId(k)) continue;
    if (v === "read" || v === "rw") out[k] = v;
  }
  return out;
}
