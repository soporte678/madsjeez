import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hasValidProductImageUrl, primaryImageUrlFromRows } from "@/lib/productVisibility";

export type CarouselProductDto = {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  freeShipping: boolean;
  sales: number;
  image: string | null;
  category: string;
  categorySlug: string;
  sellerName: string;
  reputation: string;
};

const productInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  category: { select: { name: true, slug: true } },
  seller: { select: { sellerName: true, reputationColor: true } },
} satisfies Prisma.ProductInclude;

type CarouselProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

function mapRow(p: {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  freeShipping: boolean;
  sales: number;
  images: { url: string }[];
  category: { name: string; slug: string } | null;
  seller: { sellerName: string | null; reputationColor: string | null } | null;
}): CarouselProductDto | null {
  const image = primaryImageUrlFromRows(p.images);
  if (!hasValidProductImageUrl(image)) return null;
  // Proxy images can't be optimized by next/image — skip from landing carousels
  if (image && image.startsWith("/api/img-proxy")) return null;
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    originalPrice: p.originalPrice,
    freeShipping: p.freeShipping,
    sales: p.sales,
    image,
    category: p.category?.name || "",
    categorySlug: p.category?.slug || "",
    sellerName: p.seller?.sellerName || "",
    reputation: p.seller?.reputationColor || "",
  };
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function carouselTimeSeed(): number {
  const t = new Date();
  return (
    t.getFullYear() * 1_000_000 +
    (t.getMonth() + 1) * 10_000 +
    t.getDate() * 100 +
    t.getHours() * 4 +
    Math.floor(t.getMinutes() / 2)
  );
}

type GetCarouselOptions = {
  limit?: number;
  offset?: number;
  categorySlug?: string | null;
  /** Máximo de productos en el pool antes de paginar/recortar (0 = sin tope). */
  poolCap?: number;
  provinceSlug?: string | null;
  localitySlug?: string | null;
};

const baseWhere = {
  isActive: true,
  stock: { gt: 0 },
  images: { some: {} },
} as const;

async function buildProductPool(
  categorySlug: string | null,
  poolCap: number,
  geo?: { provinceSlug?: string | null; localitySlug?: string | null }
) {
  // Filtro adicional por zona del seller (provincia/localidad).
  const sellerWhere =
    geo?.provinceSlug || geo?.localitySlug
      ? {
          seller: {
            is: {
              ...(geo.provinceSlug ? { sellerProvinceSlug: geo.provinceSlug } : {}),
              ...(geo.localitySlug ? { sellerLocalitySlug: geo.localitySlug } : {}),
            },
          },
        }
      : {};

  let primaryRows: CarouselProductRow[] = [];
  if (categorySlug) {
    const cat = await prisma.category.findFirst({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (cat) {
      primaryRows = await prisma.product.findMany({
        where: { ...baseWhere, categoryId: cat.id, ...sellerWhere },
        include: productInclude,
        orderBy: { updatedAt: "desc" },
        take: poolCap,
      });
    }
  } else if (geo?.provinceSlug || geo?.localitySlug) {
    // Geo-only: traer productos cuyo seller matchea provincia/localidad
    primaryRows = await prisma.product.findMany({
      where: { ...baseWhere, ...sellerWhere },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: poolCap,
    });
  }

  const primaryMapped = primaryRows
    .map((p) => mapRow(p))
    .filter((p): p is CarouselProductDto => p !== null);
  const primaryIds = new Set(primaryMapped.map((p) => p.id));
  let pool = [...primaryMapped];

  if (pool.length < poolCap) {
    const need = poolCap - pool.length;
    const fillerRows = await prisma.product.findMany({
      where: {
        ...baseWhere,
        ...(primaryIds.size > 0 ? { id: { notIn: [...primaryIds] } } : {}),
      },
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: need,
    });
    pool = [
      ...pool,
      ...fillerRows.map((p) => mapRow(p)).filter((p): p is CarouselProductDto => p !== null),
    ];
  }

  if (pool.length === 0) {
    const fallbackRows = await prisma.product.findMany({
      where: baseWhere,
      include: productInclude,
      orderBy: { updatedAt: "desc" },
      take: poolCap,
    });
    pool = fallbackRows
      .map((p) => mapRow(p))
      .filter((p): p is CarouselProductDto => p !== null);
  }

  return { pool, primaryCount: primaryMapped.length };
}

/**
 * Productos para carruseles: activos, con imagen.
 * Si `categorySlug` tiene pocos ítems, completa con productos de otras categorías.
 */
export async function getCarouselProducts(options: GetCarouselOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 500);
  const offset = Math.max(options.offset ?? 0, 0);
  const poolCap = options.poolCap ?? 2500;
  const categorySlug = options.categorySlug?.trim() || null;

  const totalActive = await prisma.product.count({ where: baseWhere });
  if (totalActive === 0) {
    return { products: [] as CarouselProductDto[], total: 0, poolSize: 0 };
  }

  const { pool, primaryCount } = await buildProductPool(categorySlug, poolCap, {
    provinceSlug: options.provinceSlug?.trim() || null,
    localitySlug: options.localitySlug?.trim() || null,
  });
  const seed = carouselTimeSeed();
  const shuffled = shuffleWithSeed(pool, seed);
  const slice = shuffled.slice(offset, offset + limit);
  const wrapped =
    slice.length < limit && shuffled.length > limit
      ? [...slice, ...shuffled.slice(0, limit - slice.length)]
      : slice.length < limit && shuffled.length > 0
        ? [...slice, ...shuffled.slice(0, Math.min(limit - slice.length, shuffled.length))]
        : slice;

  return {
    products: wrapped,
    total: totalActive,
    poolSize: shuffled.length,
    categorySlug,
    filledFromOtherCategories: Boolean(categorySlug && primaryCount < pool.length),
  };
}

/** Pool completo mezclado (para rotación en cliente). */
export async function getCarouselProductPool(options: {
  poolCap?: number;
  categorySlug?: string | null;
  provinceSlug?: string | null;
  localitySlug?: string | null;
}) {
  const poolCap = options.poolCap ?? 2500;
  const categorySlug = options.categorySlug?.trim() || null;
  const provinceSlug = options.provinceSlug?.trim() || null;
  const localitySlug = options.localitySlug?.trim() || null;
  const totalActive = await prisma.product.count({ where: baseWhere });
  if (totalActive === 0) {
    return { products: [] as CarouselProductDto[], total: 0, poolSize: 0 };
  }
  const { pool, primaryCount } = await buildProductPool(categorySlug, poolCap, {
    provinceSlug,
    localitySlug,
  });
  const shuffled = shuffleWithSeed(pool, carouselTimeSeed());
  return {
    products: shuffled,
    total: totalActive,
    poolSize: shuffled.length,
    categorySlug,
    filledFromOtherCategories: Boolean(categorySlug && primaryCount < pool.length),
  };
}

/** Carga estable por páginas (orden por id) para armar el pool completo en el cliente. */
export async function getCarouselProductsPage(pageOffset: number, pageSize: number) {
  const take = Math.min(Math.max(pageSize, 1), 500);
  const skip = Math.max(pageOffset, 0);

  const [total, rows] = await Promise.all([
    prisma.product.count({ where: baseWhere }),
    prisma.product.findMany({
      where: baseWhere,
      include: productInclude,
      orderBy: { id: "asc" },
      skip,
      take,
    }),
  ]);

  const products = rows
    .map((p) => mapRow(p))
    .filter((p): p is CarouselProductDto => p !== null);

  return { products, total, hasMore: skip + products.length < total };
}
