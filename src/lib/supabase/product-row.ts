/**
 * Nombres de columnas en Postgres (Prisma). La API JSON sigue usando shipping_free / sold_count.
 */

export function readFreeShipping(row: Record<string, unknown>): boolean {
  if (typeof row.free_shipping === "boolean") return row.free_shipping;
  if (typeof row.shipping_free === "boolean") return row.shipping_free;
  return false;
}

export function readSales(row: Record<string, unknown>): number {
  return Number(row.sales ?? row.sold_count ?? 0);
}

export function readViews(row: Record<string, unknown>): number {
  return Number(row.views ?? row.view_count ?? 0);
}

/** Fragmento select para PostgREST (evitar columnas legacy inexistentes). */
export const PRODUCT_LIST_SELECT =
  "id, title, price, original_price, condition, free_shipping, shipping_cost, stock, sales, views, meli_item_id, seller_id, category_id, is_active, created_at, updated_at, product_images(url), categories:category_id(name), seller:seller_id(id, name, seller_name, seller_province, seller_province_slug, seller_locality, seller_locality_slug, seller_partido)";
