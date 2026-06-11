/**
 * Sistema de indexabilidad SEO — decide si una página puede entrar al índice
 * de Google según datos REALES (cantidad de productos activos con stock).
 *
 * Regla central (Fase 5 del plan SEO): una categoría/landing solo se indexa
 * cuando tiene suficiente inventario real. Esto evita el "index bloat" de
 * páginas vacías o con muy pocos productos.
 *
 * Estado del catálogo (jun 2026): 737 productos activos, 492 categorías, de
 * las cuales solo ~29 tienen ≥5 productos con stock. Sin este gate, el sitemap
 * empuja ~378 categorías vacías al índice = contenido pobre masivo.
 */

import { prisma } from "@/lib/prisma";

/** Mínimo de productos en stock para que una categoría sea indexable. */
export const MIN_INDEX_PRODUCTS = 5;

/** Categorías muy especializadas pueden indexar con menos (nicho real). */
export const MIN_INDEX_PRODUCTS_NICHE = 3;

export type IndexStatus = "INDEX" | "NOINDEX";

/**
 * Cuenta productos activos con stock para un conjunto de categorías
 * (categoría + sus subcategorías).
 */
export async function countInStockProducts(categoryIds: string[]): Promise<number> {
  if (categoryIds.length === 0) return 0;
  try {
    return await prisma.product.count({
      where: {
        categoryId: { in: categoryIds },
        isActive: true,
        stock: { gt: 0 },
      },
    });
  } catch {
    // Ante error de DB, preferimos NO indexar (conservador) devolviendo 0.
    return 0;
  }
}

/** Decide el estado de indexación según la cantidad de productos. */
export function categoryIndexStatus(
  inStockCount: number,
  opts?: { niche?: boolean },
): IndexStatus {
  const min = opts?.niche ? MIN_INDEX_PRODUCTS_NICHE : MIN_INDEX_PRODUCTS;
  return inStockCount >= min ? "INDEX" : "NOINDEX";
}

/**
 * Robots meta listo para usar en generateMetadata().
 * follow=true siempre: aunque la página no se indexe, dejamos que Google
 * siga los links internos hacia productos/categorías que sí se indexan.
 */
export function robotsFor(status: IndexStatus) {
  if (status === "INDEX") {
    return {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" as const },
    };
  }
  return {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  };
}
