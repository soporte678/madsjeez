import { prisma } from "@/lib/prisma";
import type { HeroProduct } from "@/components/seller/premium/SellerHeroVisual";

/**
 * Productos reales para el visual del hero de las landings de vendedores.
 * Activos, con stock e imagen, ordenados por ventas. Falla a [] sin romper la
 * página (el visual se degrada solo). Se cachea con el ISR de la landing.
 */
export async function getHeroProducts(limit = 4): Promise<HeroProduct[]> {
  try {
    const rows = await prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 }, images: { some: {} } },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      orderBy: { sales: "desc" },
      take: limit,
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      price: Number(p.price),
      image: p.images[0]?.url ?? null,
    }));
  } catch {
    return [];
  }
}
