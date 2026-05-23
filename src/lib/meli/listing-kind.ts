import type { MeliItemDetail } from "./types";

/** Qué publicaciones pedir a /users/{id}/items/search */
export type MeliListingKind = "standard" | "catalog" | "all";

export function meliListingKindSearchParam(kind: MeliListingKind): string | null {
  if (kind === "standard") return "false";
  if (kind === "catalog") return "true";
  return null;
}

/** Publicación de catálogo ML (no tradicional / estándar). */
export function isMeliCatalogListing(item: MeliItemDetail): boolean {
  if (item.catalog_listing === true) return true;
  const cp = item.catalog_product_id;
  if (cp != null && String(cp).trim() !== "") return true;
  return false;
}
