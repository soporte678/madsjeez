import { prisma } from "@/lib/prisma";
import { ARGENTINA_PROVINCES } from "@/lib/seo/argentina-locations";

export const COMPRAR_MIN_PRODUCTS = 3;

export type ComprarLandingParams = {
  categoria: string;
  ciudad: string;
};

export type ComprarLandingData = {
  categorySlug: string;
  categoryName: string;
  localitySlug: string;
  localityName: string;
  provinceSlug: string;
  provinceName: string;
  productCount: number;
  sampleProducts: Array<{
    id: string;
    title: string;
    price: number;
    image: string | null;
  }>;
};

/** Todas las localidades aplanadas. */
export function allLocalitiesFlat() {
  const out: Array<{
    slug: string;
    name: string;
    provinceSlug: string;
    provinceName: string;
  }> = [];
  for (const p of ARGENTINA_PROVINCES) {
    for (const l of p.localities) {
      out.push({
        slug: l.slug,
        name: l.name,
        provinceSlug: p.slug,
        provinceName: p.name,
      });
    }
  }
  return out;
}

/** Categorías con al menos N productos activos con stock e imagen. */
export async function getCategoriesEligibleForComprar(
  minProducts = COMPRAR_MIN_PRODUCTS
): Promise<Array<{ slug: string; name: string; count: number }>> {
  const grouped = await prisma.product.groupBy({
    by: ["categoryId"],
    where: {
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
    _count: { id: true },
  });

  const eligible = grouped.filter((g) => g._count.id >= minProducts);
  const categoryIds = eligible.map((g) => g.categoryId);

  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, slug: true, name: true },
  });

  const countById = Object.fromEntries(eligible.map((g) => [g.categoryId, g._count.id]));

  return categories
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      count: countById[c.id] || 0,
    }))
    .filter((c) => c.count >= minProducts)
    .sort((a, b) => b.count - a.count);
}

export async function getAllComprarLandingParams(): Promise<ComprarLandingParams[]> {
  const categories = await getCategoriesEligibleForComprar();
  const localities = allLocalitiesFlat();
  const params: ComprarLandingParams[] = [];
  for (const cat of categories) {
    for (const loc of localities) {
      params.push({ categoria: cat.slug, ciudad: loc.slug });
    }
  }
  return params;
}

export async function getComprarLandingData(
  categorySlug: string,
  localitySlug: string
): Promise<ComprarLandingData | null> {
  const locality = allLocalitiesFlat().find((l) => l.slug === localitySlug);
  if (!locality) return null;

  const category = await prisma.category.findFirst({
    where: { slug: categorySlug },
    select: { id: true, slug: true, name: true },
  });
  if (!category) return null;

  const productCount = await prisma.product.count({
    where: {
      categoryId: category.id,
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
  });

  if (productCount < COMPRAR_MIN_PRODUCTS) return null;

  const rows = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
      stock: { gt: 0 },
      images: { some: {} },
    },
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { sales: "desc" },
    take: 12,
  });

  const sampleProducts = rows.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    image: p.images[0]?.url ?? null,
  }));

  return {
    categorySlug: category.slug,
    categoryName: category.name,
    localitySlug: locality.slug,
    localityName: locality.name,
    provinceSlug: locality.provinceSlug,
    provinceName: locality.provinceName,
    productCount,
    sampleProducts,
  };
}
