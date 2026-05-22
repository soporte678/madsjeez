import { prisma } from "@/lib/prisma";

export type CatalogProductHit = {
  id: string;
  title: string;
  price: number;
  stock: number;
  freeShipping: boolean;
  productUrl: string;
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
}

export async function searchSellerProducts(
  sellerId: string,
  customerMessage: string,
  appBase: string,
  limit = 5
): Promise<CatalogProductHit[]> {
  const terms = tokenize(customerMessage);
  const whereBase = {
    sellerId,
    isActive: true,
  };

  if (terms.length === 0) {
    const recent = await prisma.product.findMany({
      where: whereBase,
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        price: true,
        stock: true,
        freeShipping: true,
      },
    });
    return recent.map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      freeShipping: p.freeShipping,
      productUrl: `${appBase}/product/${p.id}`,
    }));
  }

  const or = terms.map((t) => ({
    title: { contains: t, mode: "insensitive" as const },
  }));

  const products = await prisma.product.findMany({
    where: { ...whereBase, OR: or },
    take: limit * 2,
    select: {
      id: true,
      title: true,
      price: true,
      stock: true,
      freeShipping: true,
    },
  });

  const scored = products
    .map((p) => {
      const title = p.title.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (title.includes(t)) score += 2;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const list = scored.length > 0 ? scored.map((s) => s.p) : products.slice(0, limit);

  return list.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    stock: p.stock,
    freeShipping: p.freeShipping,
    productUrl: `${appBase}/product/${p.id}`,
  }));
}
