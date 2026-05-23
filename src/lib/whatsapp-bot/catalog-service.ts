import { prisma } from "@/lib/prisma";
import {
  listAllActiveSellerProducts,
  searchSellerProducts,
  type CatalogProductHit,
} from "./product-search-service";

export { searchSellerProducts as searchCatalogProducts, listAllActiveSellerProducts };

export async function getActiveCatalog(
  sellerId: string,
  appBase: string,
  limit?: number
): Promise<CatalogProductHit[]> {
  const all = await listAllActiveSellerProducts(sellerId, appBase);
  return limit ? all.slice(0, limit) : all;
}

export async function getProductById(sellerId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, sellerId, isActive: true },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      attributes: { where: { name: "whatsapp_keywords" }, take: 1 },
    },
  });
}
