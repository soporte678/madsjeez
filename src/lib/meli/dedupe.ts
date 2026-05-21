/** Normalización para evitar duplicados en importación ML (título / SKU). */

export function normalizeImportTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function normalizeImportSku(sku: string | null | undefined): string | null {
  const s = (sku || "").trim();
  return s ? s.toLowerCase() : null;
}

export type SellerDedupeIndex = {
  byTitle: Map<string, string>;
  bySku: Map<string, string>;
  /** Títulos/SKU vistos en el mismo lote de importación (primer MLA gana). */
  batchTitles: Set<string>;
  batchSkus: Set<string>;
};

export function createSellerDedupeIndex(
  products: { id: string; title: string; sku: string | null }[]
): SellerDedupeIndex {
  const byTitle = new Map<string, string>();
  const bySku = new Map<string, string>();
  for (const p of products) {
    const tk = normalizeImportTitle(p.title);
    if (tk && !byTitle.has(tk)) byTitle.set(tk, p.id);
    const sk = normalizeImportSku(p.sku);
    if (sk && !bySku.has(sk)) bySku.set(sk, p.id);
  }
  return { byTitle, bySku, batchTitles: new Set(), batchSkus: new Set() };
}

export type DedupeCheckResult =
  | { duplicate: false }
  | { duplicate: true; reason: string; existingProductId?: string };

/**
 * Detecta duplicado por título idéntico o mismo SKU (catálogo local o mismo lote ML).
 * `excludeProductId`: al actualizar por meliItemId, no comparar contra sí mismo.
 */
export function checkImportDuplicate(
  index: SellerDedupeIndex,
  title: string,
  sku: string | null | undefined,
  excludeProductId?: string
): DedupeCheckResult {
  const titleKey = normalizeImportTitle(title);
  const skuKey = normalizeImportSku(sku);

  if (skuKey) {
    const existingSkuId = index.bySku.get(skuKey);
    if (existingSkuId && existingSkuId !== excludeProductId) {
      return { duplicate: true, reason: `SKU duplicado (${sku})`, existingProductId: existingSkuId };
    }
    if (index.batchSkus.has(skuKey)) {
      return { duplicate: true, reason: `SKU repetido en esta importación (${sku})` };
    }
  }

  if (titleKey) {
    const existingTitleId = index.byTitle.get(titleKey);
    if (existingTitleId && existingTitleId !== excludeProductId) {
      return {
        duplicate: true,
        reason: "Título idéntico a otro producto del catálogo",
        existingProductId: existingTitleId,
      };
    }
    if (index.batchTitles.has(titleKey)) {
      return { duplicate: true, reason: "Título repetido en esta importación" };
    }
  }

  return { duplicate: false };
}

/** Registra título/SKU tras crear o actualizar un producto. */
export function registerProductInDedupeIndex(
  index: SellerDedupeIndex,
  productId: string,
  title: string,
  sku: string | null | undefined
): void {
  const titleKey = normalizeImportTitle(title);
  const skuKey = normalizeImportSku(sku);
  if (titleKey) index.byTitle.set(titleKey, productId);
  if (skuKey) index.bySku.set(skuKey, productId);
  if (titleKey) index.batchTitles.add(titleKey);
  if (skuKey) index.batchSkus.add(skuKey);
}
