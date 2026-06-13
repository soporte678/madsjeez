/**
 * Resolución de tienda por hostname (multi-tenant).
 *
 *  parseStoreHost(host) — función pura, clasifica el host:
 *    - "app"       → host principal de Madsjeez (routing normal, no es tienda)
 *    - "subdomain" → nombre.madsjeez.com.ar  → value = "nombre"
 *    - "custom"    → dominio externo del vendedor → value = host completo
 *
 *  Los resolvers de DB se usarán desde el storefront/middleware (Fase 3/4).
 *  No están cableados a rutas vivas todavía (las tablas se crean en la
 *  migración de Fase 1, aún no aplicada a producción).
 */

import { prisma } from "@/lib/prisma";
import { isReservedStoreSlug } from "./reserved-slugs";

/** Dominio raíz de Madsjeez (sin www). */
export const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "madsjeez.com.ar").toLowerCase();

/** Hosts que NUNCA son tienda (app principal). */
const APP_HOSTS = new Set([ROOT_DOMAIN, `www.${ROOT_DOMAIN}`]);

export type StoreHost =
  | { kind: "app" }
  | { kind: "subdomain"; value: string }
  | { kind: "custom"; value: string };

/** Normaliza el header host quitando el puerto. */
function normalizeHost(host: string): string {
  return (host || "").toLowerCase().split(":")[0].trim();
}

export function parseStoreHost(rawHost: string): StoreHost {
  const host = normalizeHost(rawHost);
  if (!host || host === "localhost" || host.endsWith(".railway.app") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { kind: "app" };
  }
  if (APP_HOSTS.has(host)) return { kind: "app" };

  if (host.endsWith(`.${ROOT_DOMAIN}`)) {
    const label = host.slice(0, -(`.${ROOT_DOMAIN}`).length);
    // sólo el primer nivel (nombre.madsjeez.com.ar), no nombre.sub.madsjeez...
    if (label.includes(".") || isReservedStoreSlug(label)) return { kind: "app" };
    return { kind: "subdomain", value: label };
  }

  // cualquier otro host → dominio propio del vendedor
  return { kind: "custom", value: host };
}

/* --------------------------- resolvers de DB --------------------------- */

const STORE_PUBLIC_SELECT = {
  id: true, ownerUserId: true, name: true, slug: true, subdomain: true,
  customDomain: true, primaryDomainType: true, logoUrl: true, bannerUrl: true,
  description: true, shortDescription: true, whatsapp: true, email: true,
  province: true, city: true, category: true, primaryColor: true,
  secondaryColor: true, font: true, instagram: true, facebook: true, website: true,
  seoTitle: true, seoDescription: true, ogImageUrl: true, isActive: true,
} as const;

export function resolveStoreBySlug(slug: string) {
  return prisma.store.findUnique({ where: { slug }, select: STORE_PUBLIC_SELECT });
}

export function resolveStoreBySubdomain(subdomain: string) {
  return prisma.store.findUnique({ where: { subdomain }, select: STORE_PUBLIC_SELECT });
}

/** Sólo resuelve dominio propio si está activo y verificado (DNS+SSL). */
export async function resolveStoreByCustomDomain(domain: string) {
  const d = await prisma.storeDomain.findFirst({
    where: { domain, type: "custom", dnsStatus: "verified", sslStatus: "active" },
    select: { storeId: true },
  });
  if (!d) return null;
  return prisma.store.findUnique({ where: { id: d.storeId }, select: STORE_PUBLIC_SELECT });
}

/** Resuelve la tienda a partir del host (devuelve null si es la app principal). */
export async function resolveStoreFromHost(rawHost: string) {
  const parsed = parseStoreHost(rawHost);
  if (parsed.kind === "app") return null;
  if (parsed.kind === "subdomain") return resolveStoreBySubdomain(parsed.value);
  return resolveStoreByCustomDomain(parsed.value);
}
