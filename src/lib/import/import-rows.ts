/**
 * Lógica compartida de importación de productos normalizados.
 *
 * La usan dos entradas:
 *   - /api/import/commit  (importación por archivo CSV/Excel)
 *   - /api/integrations/[platform]/sync  (conexión directa OAuth/API)
 *
 * Sin restricciones de cantidad. Saltea duplicados por título dentro del
 * catálogo del seller. Crea categorías faltantes. Guarda URLs de imagen
 * externas tal cual (CDN públicos).
 */

import { prisma } from "@/lib/prisma";
import { stripAccents, type NormalizedRow } from "@/lib/import/platforms";

const SKU_PREFIX = "MJ-IMP";

export type ImportSummary = {
  imported: number;
  skipped: number;
  imagesAdded: number;
  errors: number;
  errorDetails: string[];
  total: number;
};

export async function importNormalizedRows(
  sellerId: string,
  rows: NormalizedRow[],
): Promise<ImportSummary> {
  // Categoría default
  let defaultCategory = await prisma.category.findFirst({ where: { slug: "general" } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.create({
      data: { name: "General", slug: "general", description: "Categoría general" },
    });
  }

  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } });
  const catMap = new Map<string, string>();
  allCategories.forEach((c) => catMap.set(c.name.toLowerCase().trim(), c.id));

  const existing = await prisma.product.findMany({
    where: { sellerId },
    select: { title: true, sku: true },
  });
  const existingTitles = new Set(existing.map((p) => p.title.toLowerCase().trim()));

  let skuCounter = 1;
  existing.forEach((p) => {
    const m = p.sku?.match(/MJ-IMP-(\d+)/);
    if (m) skuCounter = Math.max(skuCounter, parseInt(m[1], 10) + 1);
  });

  let imported = 0;
  let skipped = 0;
  let imagesAdded = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const title = (row.title || "").trim();
    if (!title || Number(row.price) <= 0) {
      skipped++;
      continue;
    }
    if (existingTitles.has(title.toLowerCase())) {
      skipped++;
      continue;
    }

    let categoryId = defaultCategory.id;
    if (row.category) {
      const key = row.category.toLowerCase().trim();
      if (catMap.has(key)) {
        categoryId = catMap.get(key)!;
      } else {
        const slug =
          stripAccents(row.category.toLowerCase())
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "")
            .substring(0, 70) || `cat-${skuCounter}`;
        try {
          const newCat = await prisma.category.create({
            data: {
              name: row.category.substring(0, 80),
              slug,
              description: row.category.substring(0, 120),
            },
          });
          catMap.set(key, newCat.id);
          categoryId = newCat.id;
        } catch {
          /* slug conflict → default */
        }
      }
    }

    const sku = `${SKU_PREFIX}-${String(skuCounter).padStart(6, "0")}`;
    skuCounter++;

    const imageUrls = (row.images || [])
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 12);

    try {
      await prisma.product.create({
        data: {
          title: title.substring(0, 200),
          description: (row.description || `${title} — Producto importado`).substring(0, 5000),
          price: row.price,
          originalPrice: row.originalPrice && row.originalPrice > row.price ? row.originalPrice : null,
          comparePrice: row.originalPrice && row.originalPrice > row.price ? row.originalPrice : null,
          stock: Math.max(0, Math.round(row.stock || 0)),
          sku,
          condition: row.condition === "used" ? "used" : "new",
          isActive: row.isActive !== false,
          isFeatured: false,
          isBoosted: false,
          views: 0,
          sales: 0,
          freeShipping: !!row.freeShipping,
          shippingCost: 0,
          qualityScore: 60,
          hasVideo: false,
          sellerId,
          categoryId,
          images: imageUrls.length
            ? {
                create: imageUrls.map((url, i) => ({
                  url: url.trim(),
                  alt: title.substring(0, 120),
                  order: i,
                })),
              }
            : undefined,
        },
      });
      existingTitles.add(title.toLowerCase());
      imported++;
      imagesAdded += imageUrls.length;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      errors.push(`"${title.substring(0, 40)}": ${msg}`);
    }
  }

  return {
    imported,
    skipped,
    imagesAdded,
    errors: errors.length,
    errorDetails: errors.slice(0, 10),
    total: rows.length,
  };
}
