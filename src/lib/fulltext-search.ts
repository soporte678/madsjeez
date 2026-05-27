/**
 * Módulo de búsqueda full-text con pg_trgm (PostgreSQL trigram)
 *
 * Reemplaza búsquedas ILIKE lentas por búsquedas con índices GIN/GIST
 * sobre trigramas, ~1000x más rápidas en tablas grandes.
 *
 * Requiere: CREATE EXTENSION IF NOT EXISTS pg_trgm;
 * Requiere índices:
 *   CREATE INDEX CONCURRENTLY idx_products_title_trgm ON products USING gin (title gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_products_desc_trgm  ON products USING gin (description gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_products_sku_trgm   ON products USING gin (sku gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_categories_name_trgm ON categories USING gin (name gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_categories_slug_trgm ON categories USING gin (slug gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_faqs_question_trgm   ON faqs USING gin (question gin_trgm_ops);
 *   CREATE INDEX CONCURRENTLY idx_faqs_answer_trgm     ON faqs USING gin (answer gin_trgm_ops);
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Umbral de similitud por defecto para pg_trgm (0..1) */
const DEFAULT_SIMILARITY_THRESHOLD = 0.3;

/** Normaliza un texto de búsqueda: minúsculas, trim, elimina espacios extra y acentos */
export function normalizeSearchQuery(query: string): string {
  return query
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Sanitiza un término para uso seguro en consultas LIKE/ILIKE */
export function sanitizeLikePattern(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

/** Calcula un score de relevancia entre un query y un título */
export function calculateRelevanceScore(
  query: string,
  title: string,
  options?: { bonusExact?: number; bonusPrefix?: number; bonusContains?: number }
): number {
  const { bonusExact = 1.0, bonusPrefix = 0.5, bonusContains = 0.3 } = options || {};
  const normalizedQuery = normalizeSearchQuery(query);
  const normalizedTitle = normalizeSearchQuery(title);

  let score = 0;

  if (normalizedTitle === normalizedQuery) {
    score += bonusExact;
  } else if (normalizedTitle.startsWith(normalizedQuery)) {
    score += bonusPrefix;
  } else if (normalizedTitle.includes(normalizedQuery)) {
    score += bonusContains;
  }

  return score;
}

// ──────────────────────────────────────────────────────────────
//  Productos — búsqueda por título con pg_trgm
// ──────────────────────────────────────────────────────────────
export async function searchProductsByTitle(
  query: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
    onlyActive?: boolean;
    onlyInStock?: boolean;
  }
) {
  const {
    limit = 10,
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
    onlyActive = true,
    onlyInStock = false,
  } = options || {};

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const activeFilter = onlyActive ? Prisma.sql`AND p.is_active = true` : Prisma.empty;
  const stockFilter = onlyInStock ? Prisma.sql`AND p.stock > 0` : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    original_price: number | null;
    condition: string;
    is_active: boolean;
    stock: number;
    sku: string | null;
    meli_item_id: string | null;
    category_id: string;
    seller_id: string;
    free_shipping: boolean;
    sales: number;
    is_boosted: boolean;
    created_at: Date;
    similarity: number;
    image_url: string | null;
  }>>`
    SELECT
      p.id,
      p.title,
      p.description,
      p.price,
      p.original_price,
      p.condition,
      p.is_active,
      p.stock,
      p.sku,
      p.meli_item_id,
      p.category_id,
      p.seller_id,
      p.free_shipping,
      p.sales,
      p.is_boosted,
      p.created_at,
      GREATEST(
        similarity(p.title, ${normalizedQuery}),
        similarity(p.description, ${normalizedQuery}),
        similarity(COALESCE(p.sku, ''), ${normalizedQuery})
      ) AS similarity,
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi."order" ASC LIMIT 1) AS image_url
    FROM products p
    WHERE (
      p.title % ${normalizedQuery}
      OR p.description % ${normalizedQuery}
      OR COALESCE(p.sku, '') % ${normalizedQuery}
    )
    ${activeFilter}
    ${stockFilter}
    ORDER BY similarity DESC, p.sales DESC
    LIMIT ${limit}
  `;

  return rows;
}

// ──────────────────────────────────────────────────────────────
//  Productos — búsqueda multi-campo con pg_trgm
// ──────────────────────────────────────────────────────────────
export async function searchProductsMultiField(
  query: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
    onlyActive?: boolean;
    onlyInStock?: boolean;
    categoryIds?: string[];
  }
) {
  const {
    limit = 10,
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
    onlyActive = true,
    onlyInStock = true,
    categoryIds,
  } = options || {};

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const activeFilter = onlyActive ? Prisma.sql`AND p.is_active = true` : Prisma.empty;
  const stockFilter = onlyInStock ? Prisma.sql`AND p.stock > 0` : Prisma.empty;
  const categoryFilter =
    categoryIds && categoryIds.length > 0
      ? Prisma.sql`AND p.category_id IN (${Prisma.join(categoryIds)})`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    similarity: number;
    image_url: string | null;
  }>>`
    SELECT
      p.id,
      p.title,
      GREATEST(
        similarity(p.title, ${normalizedQuery}),
        similarity(p.description, ${normalizedQuery}),
        similarity(COALESCE(p.sku, ''), ${normalizedQuery})
      ) AS similarity,
      (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi."order" ASC LIMIT 1) AS image_url
    FROM products p
    WHERE (
      p.title % ${normalizedQuery}
      OR p.description % ${normalizedQuery}
      OR COALESCE(p.sku, '') % ${normalizedQuery}
    )
    ${activeFilter}
    ${stockFilter}
    ${categoryFilter}
    ORDER BY similarity DESC, p.sales DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    similarity: r.similarity,
    images: r.image_url ? [{ url: r.image_url }] : [],
  }));
}

// ──────────────────────────────────────────────────────────────
//  Categorías — búsqueda con pg_trgm
// ──────────────────────────────────────────────────────────────
export async function searchCategories(
  query: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
  }
) {
  const {
    limit = 8,
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
  } = options || {};

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    slug: string;
    similarity: number;
  }>>`
    SELECT
      c.id,
      c.name,
      c.slug,
      GREATEST(
        similarity(c.name, ${normalizedQuery}),
        similarity(c.slug, ${normalizedQuery})
      ) AS similarity
    FROM categories c
    WHERE c.name % ${normalizedQuery}
       OR c.slug % ${normalizedQuery}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `;

  return rows;
}

// ──────────────────────────────────────────────────────────────
//  FAQs — búsqueda con pg_trgm
// ──────────────────────────────────────────────────────────────
export async function searchFAQs(
  query: string,
  options?: {
    limit?: number;
    similarityThreshold?: number;
    category?: string;
  }
) {
  const {
    limit = 50,
    similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
    category,
  } = options || {};

  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const categoryFilter =
    category && category !== "all"
      ? Prisma.sql`AND f.category = ${category}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    order: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    similarity: number;
  }>>`
    SELECT
      f.id,
      f.question,
      f.answer,
      f.category,
      f.order,
      f.is_active,
      f.created_at,
      f.updated_at,
      GREATEST(
        similarity(f.question, ${normalizedQuery}),
        similarity(f.answer, ${normalizedQuery})
      ) AS similarity
    FROM faqs f
    WHERE (
      f.question % ${normalizedQuery}
      OR f.answer % ${normalizedQuery}
    )
    AND f.is_active = true
    ${categoryFilter}
    ORDER BY similarity DESC, f.order ASC
    LIMIT ${limit}
  `;

  return rows;
}

// ──────────────────────────────────────────────────────────────
//  Productos — búsqueda con fallback a ILIKE
//  (usa pg_trgm primero; si no hay resultados, cae a ILIKE)
// ──────────────────────────────────────────────────────────────
export async function searchProductsWithFallback(
  query: string,
  options?: {
    limit?: number;
    onlyActive?: boolean;
    onlyInStock?: boolean;
    categoryIds?: string[];
  }
) {
  const { limit = 10, onlyActive = true, onlyInStock = true, categoryIds } = options || {};

  // 1. Intentar pg_trgm primero
  const trgmResults = await searchProductsMultiField(query, {
    limit,
    onlyActive,
    onlyInStock,
    categoryIds,
  });

  if (trgmResults.length > 0) {
    return trgmResults;
  }

  // 2. Fallback a ILIKE para queries muy cortas o sin coincidencias trigram
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) return [];

  const fallbackRows = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: normalizedQuery, mode: "insensitive" } },
        { description: { contains: normalizedQuery, mode: "insensitive" } },
        { sku: { contains: normalizedQuery, mode: "insensitive" } },
      ],
      ...(onlyActive ? { isActive: true } : {}),
      ...(onlyInStock ? { stock: { gt: 0 } } : {}),
      ...(categoryIds && categoryIds.length > 0
        ? { categoryId: { in: categoryIds } }
        : {}),
    },
    take: limit,
    select: {
      id: true,
      title: true,
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });

  return fallbackRows.map((r) => ({
    id: r.id,
    title: r.title,
    similarity: 0,
    images: r.images || [],
  }));
}
