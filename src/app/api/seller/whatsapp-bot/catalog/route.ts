import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim();

  const products = await prisma.product.findMany({
    where: {
      sellerId: auth.ctx.sellerId,
      isActive: true,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      category: { select: { name: true } },
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
    },
  });

  const filtered = category
    ? products.filter((p) => p.category.name.toLowerCase().includes(category.toLowerCase()))
    : products;

  return NextResponse.json({
    products: filtered.map((p) => ({
      id: p.id,
      title: p.title,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
      category: p.category.name,
      description: p.description.slice(0, 300),
      imageUrl: p.images[0]?.url ?? null,
      active: p.isActive,
    })),
  });
}
