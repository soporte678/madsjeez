import { prisma } from "@/lib/prisma";
import { primaryImageUrlFromRows, hasValidProductImageUrl } from "@/lib/productVisibility";
import { suggestStoreSlug, isValidStoreSlug } from "@/lib/store-slug";

const productInclude = {
  images: { orderBy: { order: "asc" as const }, take: 6 },
  category: { select: { name: true, slug: true } },
} as const;

export type PublicStoreProduct = {
  id: string;
  title: string;
  price: number;
  image: string | null;
  images: string[];
  categoryName: string;
  description: string | null;
  isAnticipo: boolean;
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

/** Tiene catálogo publicable o flag vendedor. */
export async function userQualifiesForPublicStore(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSeller: true },
  });
  if (!user) return false;
  if (user.isSeller) return true;
  const activeProducts = await prisma.product.count({
    where: { sellerId: userId, isActive: true, images: { some: {} } },
  });
  return activeProducts > 0;
}

export async function ensureStoreSlugForUser(userId: string): Promise<string | null> {
  const qualifies = await userQualifiesForPublicStore(userId);
  if (!qualifies) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { storeSlug: true, sellerName: true, name: true, isSeller: true },
  });
  if (!user) return null;

  if (!user.isSeller) {
    await prisma.user.update({
      where: { id: userId },
      data: { isSeller: true, sellerSince: new Date() },
    });
  }

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
    where: { storeSlug: slug },
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
    take: 96,
  });

  const products: PublicStoreProduct[] = [];
  for (const p of rows) {
    const image = primaryImageUrlFromRows(p.images);
    if (!hasValidProductImageUrl(image)) continue;
    const allImages = p.images
      .map((img) => img.url)
      .filter((url) => hasValidProductImageUrl(url));
    products.push({
      id: p.id,
      title: p.title,
      price: p.price,
      image,
      images: allImages,
      categoryName: p.category?.name || "",
      description: p.description ?? null,
      isAnticipo: !!(p.description && /anticipo/i.test(p.description)),
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

export type StoreBranding = {
  name: string; shortDescription: string | null; description: string | null;
  logoUrl: string | null; bannerUrl: string | null;
  primaryColor: string | null; secondaryColor: string | null;
  whatsapp: string | null; phone: string | null; email: string | null;
  instagram: string | null; facebook: string | null; website: string | null;
  tiktok: string | null;
  province: string | null; city: string | null; address: string | null; category: string | null;
  seoTitle: string | null; seoDescription: string | null; ogImageUrl: string | null;
  isActive: boolean;
};

/** Branding/tema de la tienda (tabla Store) por dueño. null si no tiene Store. */
export async function getStoreBranding(userId: string): Promise<StoreBranding | null> {
  return prisma.store.findUnique({
    where: { ownerUserId: userId },
    select: {
      name: true, shortDescription: true, description: true, logoUrl: true, bannerUrl: true,
      primaryColor: true, secondaryColor: true, whatsapp: true, phone: true, email: true,
      instagram: true, facebook: true, website: true, tiktok: true,
      province: true, city: true, address: true,
      category: true, seoTitle: true, seoDescription: true, ogImageUrl: true, isActive: true,
    },
  });
}

/**
 * Resuelve una tienda por "handle": primero el storeSlug legacy (User), y si no,
 * por la tabla Store (subdominio o slug) → ownerUserId. Lo usa el storefront para
 * soportar /tienda/[slug] y los subdominios nombre.madsjeez.com.ar.
 */
export async function getPublicStoreByHandle(handle: string): Promise<PublicStoreData | null> {
  const direct = await getPublicStoreBySlug(handle);
  if (direct) return direct;

  const store = await prisma.store.findFirst({
    where: { OR: [{ subdomain: handle }, { slug: handle }], isActive: true },
    select: { ownerUserId: true },
  });
  if (!store) return null;
  return getPublicStoreByUserId(store.ownerUserId);
}

/** Vendedores con tienda indexable (slug + al menos 1 producto activo con imagen). */
export async function listIndexableStoreSlugs(): Promise<
  Array<{ slug: string; updatedAt: Date }>
> {
  const sellers = await prisma.user.findMany({
    where: {
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
