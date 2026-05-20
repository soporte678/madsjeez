import { prisma } from "@/lib/prisma";
import { primaryImageUrlFromRows, hasValidProductImageUrl } from "@/lib/productVisibility";
import { suggestStoreSlug, isValidStoreSlug } from "@/lib/store-slug";

const productInclude = {
  images: { orderBy: { order: "asc" as const }, take: 1 },
  category: { select: { name: true, slug: true } },
} as const;

export type PublicStoreProduct = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  categoryName: string;
};

export type PublicStoreData = {
  id: string;
  storeSlug: string;
  displayName: string;
  description: string | null;
  image: string | null;
  sellerSince: Date | null;
  reputationColor: string;
  reputationLevel: string;
  totalSales: number;
  products: PublicStoreProduct[];
  productCount: number;
};

export async function ensureStoreSlugForUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storeSlug: true, sellerName: true, name: true, isSeller: true },
  });
  if (!user?.isSeller) return null;
  if (user.storeSlug) return user.storeSlug;

  const base = user.sellerName || user.name || "tienda";
  let candidate = suggestStoreSlug(base, userId.slice(-6));
  let attempt = 0;
  while (attempt < 20) {
    const slug = attempt === 0 ? candidate : `${candidate}-${attempt}`.slice(0, 48);
    const taken = await prisma.user.findFirst({
      where: { storeSlug: slug, NOT: { id: userId } },
      select: { id: true },
    });
    if (!taken && isValidStoreSlug(slug)) {
      await prisma.user.update({ where: { id: userId }, data: { storeSlug: slug } });
      return slug;
    }
    attempt++;
  }
  const fallback = `tienda-${userId.slice(0, 8)}`;
  await prisma.user.update({ where: { id: userId }, data: { storeSlug: fallback } });
  return fallback;
}

export async function getPublicStoreBySlug(slug: string): Promise<PublicStoreData | null> {
  if (!isValidStoreSlug(slug)) return null;

  const user = await prisma.user.findFirst({
    where: { storeSlug: slug, isSeller: true },
    select: {
      id: true,
      storeSlug: true,
      sellerName: true,
      name: true,
      sellerDescription: true,
      image: true,
      sellerSince: true,
      reputationColor: true,
      reputationLevel: true,
      totalSales: true,
    },
  });

  if (!user?.storeSlug) return null;

  const rows = await prisma.product.findMany({
    where: {
      sellerId: user.id,
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
    include: productInclude,
    orderBy: { updatedAt: "desc" },
    take: 48,
  });

  const products: PublicStoreProduct[] = [];
  for (const p of rows) {
    const image = primaryImageUrlFromRows(p.images);
    if (!hasValidProductImageUrl(image)) continue;
    products.push({
      id: p.id,
      title: p.title,
      price: p.price,
      image,
      categoryName: p.category?.name || "",
    });
  }

  return {
    id: user.id,
    storeSlug: user.storeSlug,
    displayName: user.sellerName || user.name || "Tienda MadsJeez",
    description: user.sellerDescription,
    image: user.image,
    sellerSince: user.sellerSince,
    reputationColor: user.reputationColor,
    reputationLevel: user.reputationLevel,
    totalSales: user.totalSales,
    products,
    productCount: products.length,
  };
}

export async function getPublicStoreByUserId(userId: string): Promise<PublicStoreData | null> {
  const slug = await ensureStoreSlugForUser(userId);
  if (!slug) return null;
  return getPublicStoreBySlug(slug);
}

/** Vendedores con tienda indexable (slug + al menos 1 producto activo con imagen). */
export async function listIndexableStoreSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  const sellers = await prisma.user.findMany({
    where: {
      isSeller: true,
      storeSlug: { not: null },
      products: {
        some: {
          isActive: true,
          stock: { gt: 0 },
          images: { some: {} },
        },
      },
    },
    select: {
      storeSlug: true,
      updatedAt: true,
    },
  });

  return sellers
    .filter((s): s is { storeSlug: string; updatedAt: Date } => Boolean(s.storeSlug))
    .map((s) => ({ slug: s.storeSlug, updatedAt: s.updatedAt }));
}
