/**
 * Validación de slug/subdominio de tienda. Reglas:
 *  - 3 a 40 caracteres, minúsculas, números y guiones (no al inicio/fin).
 *  - No puede ser un slug/subdominio reservado del sistema.
 */

/** Reservados: rutas del sistema + subdominios que no se pueden tomar. */
export const RESERVED_STORE_SLUGS = new Set<string>([
  // del PRD
  "admin", "api", "www", "app", "dashboard", "login", "checkout", "tienda",
  "soporte", "ayuda", "vendedor", "productos", "categorias", "madsjeez",
  // rutas/segmentos reales del marketplace (evitar colisión)
  "marketplace", "search", "blog", "guias", "tutoriales", "vender", "sell",
  "seller", "account", "cart", "orders", "offers", "coupons", "help",
  "subscriptions", "quienes-somos", "legal", "repuestos", "diagnostico",
  "comprar", "categories", "messages", "notifications", "settings", "perfil",
  // subdominios de infraestructura
  "mail", "smtp", "ftp", "ns", "ns1", "ns2", "cdn", "static", "assets",
  "img", "images", "media", "domains", "status", "staging", "dev", "test",
]);

export type SlugValidation = { ok: true; slug: string } | { ok: false; error: string };

export function validateStoreSlug(raw: string): SlugValidation {
  const slug = (raw || "").trim().toLowerCase();
  if (slug.length < 3) return { ok: false, error: "Mínimo 3 caracteres." };
  if (slug.length > 40) return { ok: false, error: "Máximo 40 caracteres." };
  if (!/^[a-z0-9-]+$/.test(slug)) return { ok: false, error: "Solo minúsculas, números y guiones." };
  if (/^-|-$/.test(slug)) return { ok: false, error: "No puede empezar ni terminar con guion." };
  if (/--/.test(slug)) return { ok: false, error: "No uses guiones seguidos." };
  if (RESERVED_STORE_SLUGS.has(slug)) return { ok: false, error: "Ese nombre está reservado, elegí otro." };
  return { ok: true, slug };
}

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has((slug || "").trim().toLowerCase());
}
