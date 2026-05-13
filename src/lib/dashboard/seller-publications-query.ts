import type { SupabaseClient } from "@supabase/supabase-js";
import type { Prisma } from "@prisma/client";
import { prisma as prismaSingleton } from "@/lib/prisma";

type ProductWhere = Prisma.ProductWhereInput;
type AppPrisma = typeof prismaSingleton;

/** Orden del listado de publicaciones (toolbar + modal). Una sola fuente para tipo y parseo. */
export const SELLER_PUBLICATION_SORT_OPTIONS = [
  { value: "default", label: "Más recientes", group: "Publicación" },
  { value: "title_asc", label: "Título: A → Z", group: "Publicación" },
  { value: "title_desc", label: "Título: Z → A", group: "Publicación" },
  { value: "created_asc", label: "Más antiguas primero", group: "Publicación" },
  { value: "price_asc", label: "Precio: menor a mayor", group: "Precio" },
  { value: "price_desc", label: "Precio: mayor a menor", group: "Precio" },
  { value: "stock_asc", label: "Stock: menor a mayor", group: "Stock" },
  { value: "stock_desc", label: "Stock: mayor a menor", group: "Stock" },
  { value: "views_desc", label: "Visitas: más a menos", group: "Métricas" },
  { value: "views_asc", label: "Visitas: menos a más", group: "Métricas" },
  { value: "sales_desc", label: "Ventas: más a menos", group: "Métricas" },
  { value: "sales_asc", label: "Ventas: menos a más", group: "Métricas" },
  {
    value: "conversion_desc",
    label: "Experiencia: mejor conversión (ventas / visitas)",
    group: "Métricas",
  },
  {
    value: "conversion_asc",
    label: "Experiencia: peor conversión primero",
    group: "Métricas",
  },
  { value: "quality_desc", label: "Calidad: mejor a peor", group: "Calidad" },
  { value: "quality_asc", label: "Calidad: peor a mejor", group: "Calidad" },
  { value: "condition_new_first", label: "Condición: nuevo primero", group: "Condición" },
  {
    value: "condition_used_first",
    label: "Condición: usado / reacondicionado primero",
    group: "Condición",
  },
  { value: "shipping_free_first", label: "Envío: gratis primero", group: "Envío" },
  {
    value: "shipping_buyer_pays_first",
    label: "Envío: a cargo del comprador primero",
    group: "Envío",
  },
  { value: "status_active_first", label: "Estado: activas primero", group: "Estado" },
  { value: "status_paused_first", label: "Estado: pausadas primero", group: "Estado" },
] as const;

export type SellerPublicationsSort = (typeof SELLER_PUBLICATION_SORT_OPTIONS)[number]["value"];

export type SellerPublicationFlags = {
  active: boolean;
  paused: boolean;
  noStock: boolean;
  lowStock: boolean;
  freeShip: boolean;
  buyerShip: boolean;
  newProd: boolean;
  usedProd: boolean;
  lowQuality: boolean;
  noSales: boolean;
  highPrice: boolean;
};

export type SellerPublicationQuery = {
  sort: SellerPublicationsSort;
  categoryIds: string[];
  flags: SellerPublicationFlags;
};

export const DEFAULT_SELLER_PUBLICATION_QUERY: SellerPublicationQuery = {
  sort: "default",
  categoryIds: [],
  flags: {
    active: false,
    paused: false,
    noStock: false,
    lowStock: false,
    freeShip: false,
    buyerShip: false,
    newProd: false,
    usedProd: false,
    lowQuality: false,
    noSales: false,
    highPrice: false,
  },
};

function flag(sp: URLSearchParams, key: string): boolean {
  return sp.get(key) === "1";
}

/** Parse filtros avanzados desde query string (GET /api/dashboard/products). */
export function parseSellerPublicationQuery(sp: URLSearchParams): SellerPublicationQuery {
  const sortRaw = sp.get("sort") || "default";
  const sort = SELLER_PUBLICATION_SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SellerPublicationsSort)
    : "default";

  const fromRepeat = sp.getAll("categoryId").filter(Boolean);
  const fromCsv = (sp.get("categories") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const categoryIds = fromRepeat.length ? fromRepeat : fromCsv;

  const hasAdvanced =
    categoryIds.length > 0 ||
    sort !== "default" ||
    [
      "f_active",
      "f_paused",
      "f_no_stock",
      "f_low_stock",
      "f_free_ship",
      "f_buyer_ship",
      "f_new",
      "f_used",
      "f_low_quality",
      "f_no_sales",
      "f_high_price",
    ].some((k) => sp.get(k) === "1");

  const base: SellerPublicationQuery = {
    sort,
    categoryIds,
    flags: {
      active: flag(sp, "f_active"),
      paused: flag(sp, "f_paused"),
      noStock: flag(sp, "f_no_stock"),
      lowStock: flag(sp, "f_low_stock"),
      freeShip: flag(sp, "f_free_ship"),
      buyerShip: flag(sp, "f_buyer_ship"),
      newProd: flag(sp, "f_new"),
      usedProd: flag(sp, "f_used"),
      lowQuality: flag(sp, "f_low_quality"),
      noSales: flag(sp, "f_no_sales"),
      highPrice: flag(sp, "f_high_price"),
    },
  };

  if (!hasAdvanced) {
    const status = sp.get("status");
    if (status === "active") base.flags.active = true;
    else if (status === "paused") base.flags.paused = true;
    else if (status === "low_stock") base.flags.lowStock = true;
    else if (status === "no_sales") base.flags.noSales = true;
  }

  return base;
}

export type UnifiedSellerProduct = {
  id: string;
  title: string;
  description: string | null;
  sku: string | null;
  price: number;
  originalPrice: number | null;
  stock: number;
  isActive: boolean;
  views: number;
  sales: number;
  condition: string;
  freeShipping: boolean;
  shippingCost: number;
  qualityScore: number;
  categoryId: string | null;
  category: { id: string | null; name: string } | null;
  images: { url: string }[];
  createdAt: string;
};

function prismaToUnified(p: {
  id: string;
  title: string;
  description: string | null;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  isActive: boolean;
  views: number;
  sales: number;
  condition: string;
  freeShipping: boolean;
  shippingCost: number;
  qualityScore: number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  images: { url: string }[];
  createdAt: Date;
}): UnifiedSellerProduct {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    sku: p.sku,
    price: p.price,
    originalPrice: p.comparePrice,
    stock: p.stock,
    isActive: p.isActive,
    views: p.views,
    sales: p.sales,
    condition: p.condition,
    freeShipping: p.freeShipping,
    shippingCost: p.shippingCost,
    qualityScore: p.qualityScore,
    categoryId: p.categoryId,
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    images: p.images?.length ? p.images : [{ url: "" }],
    createdAt: p.createdAt.toISOString(),
  };
}

function supabaseRowToUnified(p: Record<string, unknown>): UnifiedSellerProduct {
  const cats = p.categories as { id?: string; name?: string } | null;
  const imgs = (p.product_images as { url: string }[] | undefined) || [];
  return {
    id: String(p.id),
    title: String(p.title),
    description: (p.description as string) ?? null,
    sku: (p.sku as string) ?? null,
    price: Number(p.price),
    originalPrice: p.original_price != null ? Number(p.original_price) : null,
    stock: Number(p.stock ?? 0),
    isActive: Boolean(p.is_active),
    views: Number(p.views ?? 0),
    sales: Number(p.sales ?? 0),
    condition: String(p.condition ?? "new"),
    freeShipping: Boolean(p.free_shipping),
    shippingCost: Number(p.shipping_cost ?? 0),
    qualityScore: Number(p.quality_score ?? 0),
    categoryId: (p.category_id as string) ?? null,
    category: cats?.name ? { id: cats.id ?? (p.category_id as string) ?? null, name: cats.name } : null,
    images: imgs.length ? imgs.map((i) => ({ url: i.url })) : [{ url: "" }],
    createdAt: String(p.created_at ?? new Date().toISOString()),
  };
}

function matchesPublicationFilters(p: UnifiedSellerProduct, q: SellerPublicationQuery): boolean {
  const { flags: f, categoryIds } = q;

  if (categoryIds.length > 0) {
    const cid = p.categoryId;
    if (!cid || !categoryIds.includes(cid)) return false;
  }

  if (f.active || f.paused) {
    if (!(f.active && f.paused)) {
      if (f.active && !p.isActive) return false;
      if (f.paused && p.isActive) return false;
    }
  }

  if (f.noStock || f.lowStock) {
    const okNo = p.stock === 0;
    const okLow = p.stock > 0 && p.stock <= 5;
    if (f.noStock && f.lowStock) {
      if (!okNo && !okLow) return false;
    } else if (f.noStock && !okNo) return false;
    else if (f.lowStock && !okLow) return false;
  }

  if (f.freeShip || f.buyerShip) {
    const okFree = p.freeShipping === true;
    const okBuyer = p.freeShipping === false;
    if (f.freeShip && f.buyerShip) {
      if (!okFree && !okBuyer) return false;
    } else if (f.freeShip && !okFree) return false;
    else if (f.buyerShip && !okBuyer) return false;
  }

  if (f.newProd || f.usedProd) {
    const isNew = p.condition === "new";
    const isUsed = p.condition === "used" || p.condition === "refurbished";
    if (f.newProd && f.usedProd) {
      if (!isNew && !isUsed) return false;
    } else if (f.newProd && !isNew) return false;
    else if (f.usedProd && !isUsed) return false;
  }

  if (f.lowQuality && !(p.qualityScore < 40)) return false;
  if (f.noSales && !(p.sales === 0)) return false;
  if (f.highPrice) {
    const o = p.originalPrice;
    if (o == null || !(o > p.price)) return false;
  }

  return true;
}

function conditionRank(c: string): number {
  if (c === "new") return 0;
  if (c === "used" || c === "refurbished") return 1;
  return 2;
}

function conversionScore(p: UnifiedSellerProduct): number {
  if (p.views > 0) return p.sales / p.views;
  return p.sales > 0 ? 1 : 0;
}

function sortMerged(list: UnifiedSellerProduct[], sort: SellerPublicationsSort): UnifiedSellerProduct[] {
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (sort) {
      case "title_asc":
        cmp = a.title.localeCompare(b.title, "es");
        break;
      case "title_desc":
        cmp = b.title.localeCompare(a.title, "es");
        break;
      case "price_asc":
        cmp = a.price - b.price;
        break;
      case "price_desc":
        cmp = b.price - a.price;
        break;
      case "stock_asc":
        cmp = a.stock - b.stock;
        break;
      case "stock_desc":
        cmp = b.stock - a.stock;
        break;
      case "views_desc":
        cmp = b.views - a.views;
        break;
      case "views_asc":
        cmp = a.views - b.views;
        break;
      case "sales_desc":
        cmp = b.sales - a.sales;
        break;
      case "sales_asc":
        cmp = a.sales - b.sales;
        break;
      case "conversion_desc":
        cmp = conversionScore(b) - conversionScore(a);
        break;
      case "conversion_asc":
        cmp = conversionScore(a) - conversionScore(b);
        break;
      case "quality_desc":
        cmp = b.qualityScore - a.qualityScore;
        break;
      case "quality_asc":
        cmp = a.qualityScore - b.qualityScore;
        break;
      case "condition_new_first":
        cmp = conditionRank(a.condition) - conditionRank(b.condition);
        break;
      case "condition_used_first":
        cmp = conditionRank(b.condition) - conditionRank(a.condition);
        break;
      case "shipping_free_first":
        cmp = Number(b.freeShipping) - Number(a.freeShipping);
        break;
      case "shipping_buyer_pays_first":
        cmp = Number(a.freeShipping) - Number(b.freeShipping);
        break;
      case "status_active_first":
        cmp = Number(b.isActive) - Number(a.isActive);
        break;
      case "status_paused_first":
        cmp = Number(a.isActive) - Number(b.isActive);
        break;
      case "created_asc":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      default:
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        break;
    }
    if (cmp !== 0) return cmp;
    return a.title.localeCompare(b.title, "es");
  });
}

function buildPrismaWhere(userId: string, q: SellerPublicationQuery): ProductWhere {
  const parts: Prisma.ProductWhereInput[] = [{ sellerId: userId }];

  if (q.categoryIds.length) {
    parts.push({ categoryId: { in: q.categoryIds } });
  }

  if (q.flags.active && !q.flags.paused) parts.push({ isActive: true });
  else if (q.flags.paused && !q.flags.active) parts.push({ isActive: false });

  if (q.flags.noStock && q.flags.lowStock) {
    parts.push({ OR: [{ stock: 0 }, { AND: [{ stock: { gt: 0 } }, { stock: { lte: 5 } }] }] });
  } else if (q.flags.noStock) parts.push({ stock: 0 });
  else if (q.flags.lowStock) parts.push({ stock: { gt: 0, lte: 5 } });

  if (q.flags.freeShip && !q.flags.buyerShip) parts.push({ freeShipping: true });
  else if (q.flags.buyerShip && !q.flags.freeShip) parts.push({ freeShipping: false });

  if (q.flags.newProd && !q.flags.usedProd) parts.push({ condition: "new" });
  else if (q.flags.usedProd && !q.flags.newProd) {
    parts.push({ OR: [{ condition: "used" }, { condition: "refurbished" }] });
  } else if (q.flags.newProd && q.flags.usedProd) {
    /* any */
  }

  if (q.flags.lowQuality) parts.push({ qualityScore: { lt: 40 } });
  if (q.flags.noSales) parts.push({ sales: 0 });
  /* comparePrice > price se aplica en memoria (fetchPrismaUnified). */

  return parts.length === 1 ? parts[0]! : { AND: parts };
}

/** Excluye highPrice del WHERE de Prisma (comparación comparePrice > price en memoria). */
export function buildPrismaWhereSeller(userId: string, q: SellerPublicationQuery): ProductWhere {
  const q2 = { ...q, flags: { ...q.flags, highPrice: false } };
  return buildPrismaWhere(userId, q2);
}

async function fetchPrismaUnified(
  prisma: AppPrisma,
  userId: string,
  q: SellerPublicationQuery
): Promise<UnifiedSellerProduct[]> {
  const where = buildPrismaWhereSeller(userId, q);
  const rows = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      images: { select: { url: true }, take: 1, orderBy: { order: "asc" } },
    },
  });
  type Row = (typeof rows)[number];
  let list = rows.map((p: Row) =>
    prismaToUnified({
      ...p,
      comparePrice: p.comparePrice,
      images: p.images,
    })
  );
  if (q.flags.highPrice) {
    list = list.filter((p: UnifiedSellerProduct) => p.originalPrice != null && p.originalPrice > p.price);
  }
  list = list.filter((p: UnifiedSellerProduct) => matchesPublicationFilters(p, q));
  return list;
}

async function fetchSupabaseUnified(
  supabase: SupabaseClient,
  supabaseUserId: string,
  q: SellerPublicationQuery
): Promise<UnifiedSellerProduct[]> {
  let query = supabase
    .from("products")
    .select("*, product_images(url), categories:category_id(id,name)")
    .eq("seller_id", supabaseUserId);

  if (q.categoryIds.length) query = query.in("category_id", q.categoryIds);

  const { data, error } = await query;
  if (error || !data) return [];

  let list = (data as Record<string, unknown>[]).map(supabaseRowToUnified);
  if (q.flags.highPrice) {
    list = list.filter((p) => p.originalPrice != null && p.originalPrice > p.price);
  }
  list = list.filter((p) => matchesPublicationFilters(p, q));
  return list;
}

export async function listMergedSellerPublications(params: {
  prisma: AppPrisma;
  supabase: SupabaseClient | null;
  prismaUserId: string;
  supabaseUserId: string | null;
  q: SellerPublicationQuery;
  page: number;
  limit: number;
}): Promise<{
  products: UnifiedSellerProduct[];
  total: number;
  totalPages: number;
  page: number;
}> {
  const { prisma, supabase, prismaUserId, supabaseUserId, q, page, limit } = params;

  const [a, b] = await Promise.all([
    fetchPrismaUnified(prisma, prismaUserId, q),
    supabase && supabaseUserId
      ? fetchSupabaseUnified(supabase, supabaseUserId, q)
      : Promise.resolve([] as UnifiedSellerProduct[]),
  ]);

  const merged = sortMerged([...a, ...b], q.sort);
  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const skip = (page - 1) * limit;
  const products = merged.slice(skip, skip + limit);

  return { products, total, totalPages, page };
}

const FLAG_PARAM_KEYS: { key: keyof SellerPublicationFlags; param: string }[] = [
  { key: "active", param: "f_active" },
  { key: "paused", param: "f_paused" },
  { key: "noStock", param: "f_no_stock" },
  { key: "lowStock", param: "f_low_stock" },
  { key: "freeShip", param: "f_free_ship" },
  { key: "buyerShip", param: "f_buyer_ship" },
  { key: "newProd", param: "f_new" },
  { key: "usedProd", param: "f_used" },
  { key: "lowQuality", param: "f_low_quality" },
  { key: "noSales", param: "f_no_sales" },
  { key: "highPrice", param: "f_high_price" },
];

/** Serializa el estado del modal hacia query string de GET /api/dashboard/products. */
export function sellerPublicationQueryToSearchParams(
  q: SellerPublicationQuery,
  page: number,
  limit: number
): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", String(page));
  p.set("limit", String(limit));
  if (q.sort !== "default") p.set("sort", q.sort);
  for (const id of q.categoryIds) {
    p.append("categoryId", id);
  }
  for (const { key, param } of FLAG_PARAM_KEYS) {
    if (q.flags[key]) p.set(param, "1");
  }
  return p;
}
