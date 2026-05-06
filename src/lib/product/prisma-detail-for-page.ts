import { prisma } from "@/lib/prisma";

/** Shape compatible con la página `/product/[id]` cuando el origen es Prisma (ej. importación ML). */
export async function getPrismaProductDetailBundle(prismaProductId: string) {
  const raw = await prisma.product.findUnique({
    where: { id: prismaProductId },
    include: {
      seller: true,
      category: true,
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!raw || !raw.isActive) return null;

  await prisma.product.update({
    where: { id: raw.id },
    data: { views: { increment: 1 } },
  });

  const product = {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    price: raw.price,
    original_price: raw.originalPrice,
    condition: raw.condition,
    category_id: raw.categoryId,
    seller_id: raw.sellerId,
    stock: raw.stock,
    shipping_cost: raw.shippingCost,
    shipping_free: raw.freeShipping,
    sales: raw.sales,
    views: raw.views + 1,
    product_images: raw.images.map((img, i) => ({
      id: img.id,
      url: img.url,
      order: img.order,
      is_primary: i === 0,
    })),
    categories: {
      name: raw.category.name,
      slug: raw.category.slug,
    },
    seller: {
      sellerName: raw.seller.sellerName,
      name: raw.seller.name,
      total_sales: raw.seller.totalSales,
      reputation_level: raw.seller.reputationLevel,
      reputation_color: raw.seller.reputationColor,
    },
    meli_item_id: raw.meliItemId,
  };

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: raw.categoryId,
      isActive: true,
      NOT: { id: raw.id },
    },
    take: 6,
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });

  const sellerProducts = await prisma.product.findMany({
    where: {
      sellerId: raw.sellerId,
      isActive: true,
      NOT: { id: raw.id },
    },
    take: 5,
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });

  const topRatedProducts = await prisma.product.findMany({
    where: {
      categoryId: raw.categoryId,
      isActive: true,
      NOT: { id: raw.id },
    },
    orderBy: { sales: "desc" },
    take: 6,
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
  });

  const reviewsRaw = await prisma.review.findMany({
    where: { productId: raw.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const mapMini = (rows: typeof relatedProducts) =>
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      price: r.price,
      primary_image: r.images[0]?.url ?? null,
    }));

  const productReviews = reviewsRaw.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.createdAt.toISOString(),
    reviewer_id: r.reviewerId,
  }));

  return {
    product,
    relatedProducts: mapMini(relatedProducts),
    sellerProducts: mapMini(sellerProducts),
    topRatedProducts: mapMini(topRatedProducts),
    productReviews,
  };
}
