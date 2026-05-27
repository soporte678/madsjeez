import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { hasValidProductImageUrl } from "@/lib/productVisibility";
import { resolveCategoryIds } from "@/lib/categoryCatalog";
import { PRODUCT_LIST_SELECT, readFreeShipping, readSales } from "@/lib/supabase/product-row";

export const dynamic = "force-dynamic";

type UnifiedProduct = {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  condition: string;
  shipping_free: boolean;
  sales: number;
  sold_count: number;
  meli_item_id?: string | null;
  primary_image: string | null;
  seller_name: string | null;
  seller_id: string | null;
  category_name: string | null;
  is_promoted?: boolean;
  created_at?: string | null;
};

function mapSupabaseRow(p: Record<string, unknown>): UnifiedProduct {
  const imgs = p.product_images as Array<{ url?: string; is_primary?: boolean }> | undefined;
  const primary =
    imgs?.find((img) => img.is_primary)?.url || imgs?.[0]?.url || null;
  const profiles = p.profiles as { full_name?: string } | undefined;
  const cats = p.categories as { name?: string } | undefined;

  return {
    id: String(p.id),
    title: String(p.title ?? ""),
    price: Number(p.price ?? 0),
    original_price:
      p.original_price !== undefined && p.original_price !== null
        ? Number(p.original_price)
        : null,
    condition: String(p.condition ?? "new"),
    shipping_free: readFreeShipping(p),
    sales: readSales(p),
    sold_count: readSales(p),
    meli_item_id: (p.meli_item_id as string) ?? null,
    primary_image: typeof primary === "string" ? primary.trim() : null,
    seller_name: profiles?.full_name ?? null,
    seller_id: (p.seller_id as string) ?? null,
    category_name: cats?.name ?? null,
    is_promoted: typeof p.is_promoted === "boolean" ? p.is_promoted : false,
    created_at: (p.created_at as string) ?? null,
  };
}

function mapPrismaProduct(p: {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  freeShipping: boolean;
  sales: number;
  meliItemId: string | null;
  createdAt: Date;
  isBoosted: boolean;
  seller: { id: string; name: string | null; sellerName: string | null };
  category: { name: string };
  images: Array<{ url: string }>;
}): UnifiedProduct {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    original_price: p.originalPrice,
    condition: p.condition,
    shipping_free: p.freeShipping,
    sales: p.sales,
    sold_count: p.sales,
    meli_item_id: p.meliItemId,
    primary_image: p.images[0]?.url?.trim() ?? null,
    seller_name: p.seller.sellerName || p.seller.name || null,
    seller_id: p.seller.id,
    category_name: p.category.name,
    is_promoted: p.isBoosted,
    created_at: p.createdAt.toISOString(),
  };
}

function sortUnified(products: UnifiedProduct[], sort: string): UnifiedProduct[] {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      arr.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      arr.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      break;
    default:
      arr.sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted) || b.sales - a.sales);
  }
  return arr;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchTokens(query: string | null): string[] {
  if (!query) return [];
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .map((token) => token.replace(/[^\p{L}\p{N}-]/gu, ""))
        .filter((token) => token.length >= 2)
    )
  ).slice(0, 6);
}

function sanitizePostgrestTerm(term: string) {
  return term.replace(/[,%()]/g, " ").trim();
}

function buildSupabaseSearchOr(query: string, tokens: string[]) {
  const terms = Array.from(new Set([query, ...tokens]))
    .map(sanitizePostgrestTerm)
    .filter(Boolean)
    .slice(0, 8);

  return terms
    .flatMap((term) => [
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `meli_item_id.ilike.%${term}%`,
    ])
    .join(",");
}

function relevanceScore(product: UnifiedProduct, query: string | null, tokens: string[]) {
  let score = 0;
  const title = normalizeSearch(product.title);
  const category = normalizeSearch(product.category_name || "");
  const fullQuery = normalizeSearch(query || "");

  if (product.is_promoted) score += 40;
  if (fullQuery && title.startsWith(fullQuery)) score += 35;
  if (fullQuery && title.includes(fullQuery)) score += 25;
  if (tokens.length > 0 && tokens.every((token) => title.includes(normalizeSearch(token)))) score += 20;

  for (const token of tokens) {
    const normalizedToken = normalizeSearch(token);
    if (title.includes(normalizedToken)) score += 8;
    if (category.includes(normalizedToken)) score += 5;
  }

  score += Math.min(product.sales || product.sold_count || 0, 100) / 10;
  return score;
}

function sortUnifiedWithRelevance(products: UnifiedProduct[], sort: string, query: string | null, tokens: string[]) {
  if (sort !== "relevance") return sortUnified(products, sort);

  return [...products].sort((a, b) => {
    const diff = relevanceScore(b, query, tokens) - relevanceScore(a, query, tokens);
    if (diff !== 0) return diff;
    return Number(b.is_promoted) - Number(a.is_promoted) || b.sales - a.sales;
  });
}

/**
 * GET /api/search/listings
 *
 * Búsqueda de productos con paginación y filtros.
 * La parte de búsqueda de texto ahora usa pg_trgm en vez de ILIKE
 * para la consulta Prisma (la consulta Supabase mantiene ILIKE
 * porque PostgREST no soporta pg_trgm de forma nativa).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    const cond = searchParams.get("condition");
    const sort = searchParams.get("sort") || "relevance";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const freeShip = searchParams.get("free_shipping");
    const limit = Math.min(parseInt(searchParams.get("limit") || "48", 10) || 48, 96);
    const tokens = getSearchTokens(q);
    const categoryIds = await resolveCategoryIds(cat);

    let sbQuery = supabaseService
      .from("products")
      .select(PRODUCT_LIST_SELECT)
      .eq("is_active", true);

    if (q?.trim()) {
      const searchOr = buildSupabaseSearchOr(q.trim(), tokens);
      if (searchOr) sbQuery = sbQuery.or(searchOr);
    }
    if (categoryIds.length === 1) sbQuery = sbQuery.eq("category_id", categoryIds[0]);
    if (categoryIds.length > 1) sbQuery = sbQuery.in("category_id", categoryIds);
    if (cond) sbQuery = sbQuery.eq("condition", cond);
    if (minPrice) sbQuery = sbQuery.gte("price", parseInt(minPrice, 10));
    if (maxPrice) sbQuery = sbQuery.lte("price", parseInt(maxPrice, 10));
    if (freeShip === "true") sbQuery = sbQuery.eq("free_shipping", true);

    switch (sort) {
      case "price_asc":
        sbQuery = sbQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        sbQuery = sbQuery.order("price", { ascending: false });
        break;
      case "newest":
        sbQuery = sbQuery.order("created_at", { ascending: false });
        break;
      default:
        // relevance: sin depender de `is_promoted` (columna ausente en algunos proyectos Supabase)
        sbQuery = sbQuery.order("updated_at", { ascending: false });
    }

    const { data: sbData, error: sbErr } = await sbQuery.limit(limit);
    if (sbErr) {
      console.error("search/listings supabase:", sbErr);
    }

    // ════════════════════════════════════════════════════════════
    // BÚSQUEDA PRISMA — ahora usa pg_trgm en vez de ILIKE
    // ════════════════════════════════════════════════════════════
    // 1. Obtener IDs de productos coincidentes via pg_trgm
    let matchingIds: string[] = [];
    if (q?.trim() && tokens.length > 0) {
      const searchQuery = normalizeSearch(q.trim());
      const categoryFilter =
        categoryIds.length > 0
          ? Prisma.sql`AND p.category_id IN (${Prisma.join(categoryIds)})`
          : Prisma.empty;
      const conditionFilter = cond ? Prisma.sql`AND p.condition = ${cond}` : Prisma.empty;
      const minPriceFilter = minPrice
        ? Prisma.sql`AND p.price >= ${parseFloat(minPrice)}`
        : Prisma.empty;
      const maxPriceFilter = maxPrice
        ? Prisma.sql`AND p.price <= ${parseFloat(maxPrice)}`
        : Prisma.empty;
      const freeShipFilter =
        freeShip === "true" ? Prisma.sql`AND p.free_shipping = true` : Prisma.empty;

      const idRows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT p.id
        FROM products p
        WHERE (
          p.title % ${searchQuery}
          OR p.description % ${searchQuery}
          OR COALESCE(p.sku, '') % ${searchQuery}
          OR COALESCE(p.meli_item_id, '') % ${searchQuery}
        )
        AND p.is_active = true
        ${categoryFilter}
        ${conditionFilter}
        ${minPriceFilter}
        ${maxPriceFilter}
        ${freeShipFilter}
        ORDER BY
          GREATEST(
            similarity(p.title, ${searchQuery}),
            similarity(p.description, ${searchQuery}),
            similarity(COALESCE(p.sku, ''), ${searchQuery}),
            similarity(COALESCE(p.meli_item_id, ''), ${searchQuery})
          ) DESC,
          p.sales DESC
        LIMIT ${limit * 2}
      `;
      matchingIds = idRows.map((r) => r.id);
    }

    // 2. Construir el WHERE de Prisma usando los IDs de pg_trgm
    const prismaWhere: Prisma.ProductWhereInput = { isActive: true };
    if (matchingIds.length > 0) {
      prismaWhere.id = { in: matchingIds };
    } else if (q?.trim() && tokens.length > 0) {
      // pg_trgm no encontró nada pero había búsqueda → resultado vacío
      prismaWhere.id = { in: [] };
    }
    // (si no había query, no se aplica filtro de texto → devuelve todos los activos)

    if (categoryIds.length === 1) prismaWhere.categoryId = categoryIds[0];
    if (categoryIds.length > 1) prismaWhere.categoryId = { in: categoryIds };
    if (cond) prismaWhere.condition = cond;
    const priceRange: Prisma.FloatFilter = {};
    if (minPrice) priceRange.gte = parseFloat(minPrice);
    if (maxPrice) priceRange.lte = parseFloat(maxPrice);
    if (Object.keys(priceRange).length > 0) prismaWhere.price = priceRange;
    if (freeShip === "true") prismaWhere.freeShipping = true;

    const prismaRows = await prisma.product.findMany({
      where: prismaWhere,
      take: limit,
      include: {
        seller: { select: { id: true, name: true, sellerName: true } },
        category: { select: { name: true } },
        images: { orderBy: { order: "asc" }, take: 5 },
      },
      orderBy:
        sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_desc"
            ? { price: "desc" }
            : sort === "newest"
              ? { createdAt: "desc" }
              : [{ isBoosted: "desc" }, { updatedAt: "desc" }],
    });
    // ════════════════════════════════════════════════════════════

    const prismaUnified = prismaRows.map(mapPrismaProduct);
    const prismaByMeli = new Map<string, UnifiedProduct>();
    for (const u of prismaUnified) {
      if (u.meli_item_id) prismaByMeli.set(u.meli_item_id, u);
    }

    const sbList = (sbData || []).map((row: Record<string, unknown>) =>
      mapSupabaseRow(row)
    );
    const sbFiltered = sbList.filter((row) => {
      if (!row.meli_item_id) return true;
      return !prismaByMeli.has(row.meli_item_id);
    });

    const mergedMap = new Map<string, UnifiedProduct>();
    for (const u of prismaUnified) mergedMap.set(`p:${u.id}`, u);
    for (const u of sbFiltered) mergedMap.set(`s:${u.id}`, u);

    let merged = Array.from(mergedMap.values()).filter((row) =>
      hasValidProductImageUrl(row.primary_image)
    );
    merged = sortUnifiedWithRelevance(merged, sort, q, tokens).slice(0, limit);

    return NextResponse.json({ products: merged });
  } catch (e) {
    console.error("GET /api/search/listings:", e);
    return NextResponse.json({ error: "Error al cargar resultados" }, { status: 500 });
  }
}
