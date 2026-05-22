import { prisma } from "@/lib/prisma";
import { searchSellerProducts, type CatalogProductHit } from "./product-search-service";

export { searchSellerProducts as searchCatalogProducts };

export async function getActiveCatalog(
  sellerId: string,
  appBase: string,
  limit = 20
): Promise<CatalogProductHit[]> {
  return searchSellerProducts(sellerId, "", appBase, limit);
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
