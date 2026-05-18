import { prisma } from "@/lib/prisma";
import { seedCategoriesIfEmpty } from "@/lib/seed-categories";

export type CategoryCatalogChild = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
};

export type CategoryCatalogItem = CategoryCatalogChild & {
  children: CategoryCatalogChild[];
};

export async function getCategoryCatalog(): Promise<CategoryCatalogItem[]> {
  await seedCategoriesIfEmpty();

  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
      },
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => {
    const children = category.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      productCount: child._count.products,
    }));

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      productCount:
        category._count.products +
        children.reduce((total, child) => total + child.productCount, 0),
      children,
    };
  });
}

export async function resolveCategoryIds(categoryParam: string | null): Promise<string[]> {
  if (!categoryParam?.trim()) return [];

  const value = categoryParam.trim();
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id: value }, { slug: value }],
    },
    select: { id: true },
  });

  if (!category) {
    return [value];
  }

  const children = await prisma.category.findMany({
    where: { parentId: category.id },
    select: { id: true },
  });

  return [category.id, ...children.map((child) => child.id)];
}
