/**
 * Servicio server-side de Madsjeez Tiendas (Fase 2).
 * Ownership: la tienda está keyed por ownerUserId, así que un vendedor sólo
 * puede leer/editar la suya. Requiere que la migración de Fase 1 esté aplicada.
 */

import { prisma } from "@/lib/prisma";
import { slugifyStoreName } from "@/lib/store-slug";
import { validateStoreSlug } from "./reserved-slugs";

/** Genera un slug único para Store (no colisiona con otra tienda ni con storeSlug legacy). */
export async function ensureUniqueStoreSlug(base: string, userId: string): Promise<string> {
  const root = slugifyStoreName(base || "tienda").slice(0, 40) || "tienda";
  for (let attempt = 0; attempt < 25; attempt++) {
    const candidate = (attempt === 0 ? root : `${root}-${attempt}`).slice(0, 40);
    const v = validateStoreSlug(candidate);
    if (!v.ok) continue;
    const taken = await isSlugTaken(candidate, userId);
    if (!taken) return candidate;
  }
  return `tienda-${userId.slice(0, 8)}`;
}

/** ¿El slug ya está tomado por otra tienda o por el storeSlug legacy de otro user? */
export async function isSlugTaken(slug: string, userId: string): Promise<boolean> {
  const [store, legacy] = await Promise.all([
    prisma.store.findFirst({ where: { slug, NOT: { ownerUserId: userId } }, select: { id: true } }),
    prisma.user.findFirst({ where: { storeSlug: slug, NOT: { id: userId } }, select: { id: true } }),
  ]);
  return Boolean(store || legacy);
}

/** Get-or-create: crea la tienda con defaults del usuario en el primer acceso. */
export async function getOrCreateStore(userId: string) {
  const existing = await prisma.store.findUnique({ where: { ownerUserId: userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true, sellerName: true, storeSlug: true, sellerDescription: true,
      image: true, sellerProvince: true, sellerLocality: true,
    },
  });

  const slug = user?.storeSlug || (await ensureUniqueStoreSlug(user?.sellerName || user?.name || "tienda", userId));

  return prisma.store.create({
    data: {
      ownerUserId: userId,
      name: (user?.sellerName || user?.name || "Mi tienda").slice(0, 80),
      slug,
      description: user?.sellerDescription || null,
      logoUrl: user?.image || null,
      province: user?.sellerProvince || null,
      city: user?.sellerLocality || null,
      isActive: false,
    },
  });
}

/* ----------------------------- validación de update ----------------------------- */

const HEX = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
const url = (v: unknown) => {
  const s = typeof v === "string" ? v.trim() : "";
  return /^https?:\/\/.+/i.test(s) ? s.slice(0, 500) : undefined;
};

export type StorePatch = Record<string, unknown>;
export type PatchResult = { ok: true; data: Record<string, unknown> } | { ok: false; status: number; error: string };

/**
 * Construye el objeto de update validado/saneado. `tier` controla el gating:
 *  - FREE: URL interna /tienda/slug + diseño básico.
 *  - PLATA/GOLD (Pro): subdominio + diseño/colores.
 *  - PLATINUM (Premium): dominio propio (se maneja en el módulo de dominios, Fase 5).
 */
export async function buildStorePatch(userId: string, body: StorePatch, tier: string): Promise<PatchResult> {
  const data: Record<string, unknown> = {};
  const isPro = tier !== "FREE";

  // Slug (todas las tiendas)
  if (body.slug !== undefined) {
    const v = validateStoreSlug(slugifyStoreName(String(body.slug)));
    if (!v.ok) return { ok: false, status: 400, error: v.error };
    if (await isSlugTaken(v.slug, userId)) return { ok: false, status: 409, error: "Ese nombre de tienda ya está en uso." };
    data.slug = v.slug;
  }

  // Subdominio (Pro+)
  if (body.subdomain !== undefined && body.subdomain !== null && body.subdomain !== "") {
    if (!isPro) return { ok: false, status: 402, error: "El subdominio está disponible en el plan Pro." };
    const v = validateStoreSlug(slugifyStoreName(String(body.subdomain)));
    if (!v.ok) return { ok: false, status: 400, error: `Subdominio inválido: ${v.error}` };
    const taken = await prisma.store.findFirst({ where: { subdomain: v.slug, NOT: { ownerUserId: userId } }, select: { id: true } });
    if (taken) return { ok: false, status: 409, error: "Ese subdominio ya está en uso." };
    data.subdomain = v.slug;
  }

  // Texto/datos básicos
  const map: Array<[string, number]> = [
    ["name", 80], ["shortDescription", 160], ["whatsapp", 30], ["email", 120],
    ["province", 80], ["city", 80], ["address", 160], ["category", 60], ["font", 40],
    ["seoTitle", 70], ["seoDescription", 180],
  ];
  for (const [key, max] of map) {
    if (body[key] !== undefined) data[key] = str(body[key], max) ?? null;
  }
  if (body.description !== undefined) data.description = str(body.description, 2000) ?? null;

  // Colores (hex) — diseño Pro, pero permitimos guardarlos siempre
  for (const key of ["primaryColor", "secondaryColor"]) {
    if (body[key] !== undefined) {
      const s = typeof body[key] === "string" ? (body[key] as string).trim() : "";
      if (s && !HEX.test(s)) return { ok: false, status: 400, error: "Color inválido (usá formato #RRGGBB)." };
      data[key] = s || null;
    }
  }

  // URLs (logo/banner/redes/og)
  for (const key of ["logoUrl", "bannerUrl", "instagram", "facebook", "website", "ogImageUrl"]) {
    if (body[key] !== undefined) data[key] = url(body[key]) ?? null;
  }

  // Publicar / despublicar
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  return { ok: true, data };
}
