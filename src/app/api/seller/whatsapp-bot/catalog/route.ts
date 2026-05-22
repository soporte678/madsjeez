import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import { searchCatalogProducts } from "@/lib/whatsapp-bot/catalog-service";

function appBaseFromRequest(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const category = req.nextUrl.searchParams.get("category")?.trim();
  const activeOnly = req.nextUrl.searchParams.get("active") !== "false";

  if (q.length >= 2) {
    const hits = await searchCatalogProducts(
      auth.ctx.sellerId,
      q,
      appBaseFromRequest(req),
      40
    );
    const ids = hits.map((h) => h.id);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, sellerId: auth.ctx.sellerId },
      include: {
        category: { select: { name: true } },
        images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
        attributes: { where: { name: "whatsapp_keywords" }, take: 1 },
      },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return NextResponse.json({
      products: hits
        .map((h) => byId.get(h.id))
        .filter(Boolean)
        .map((p) => mapProduct(p!)),
    });
  }

  const products = await prisma.product.findMany({
    where: {
      sellerId: auth.ctx.sellerId,
      ...(activeOnly ? { isActive: true } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 80,
    include: {
      category: { select: { name: true } },
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      attributes: { where: { name: "whatsapp_keywords" }, take: 1 },
    },
  });

  const filtered = category
    ? products.filter((p) =>
        p.category.name.toLowerCase().includes(category.toLowerCase())
      )
    : products;

  return NextResponse.json({
    products: filtered.map((p) => mapProduct(p)),
  });
}

function mapProduct(
  p: {
    id: string;
    title: string;
    sku: string | null;
    price: number;
    stock: number;
    description: string;
    isActive: boolean;
    category: { name: string };
    images: { url: string }[];
    attributes: { value: string }[];
  }
) {
  return {
    id: p.id,
    title: p.title,
    sku: p.sku,
    price: p.price,
    stock: p.stock,
    category: p.category.name,
    description: p.description.slice(0, 300),
    imageUrl: p.images[0]?.url ?? null,
    active: p.isActive,
    keywords: p.attributes[0]?.value ?? "",
  };
}

export async function PATCH(req: NextRequest) {
  const auth = await requireSellerSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json().catch(() => ({}));
  const productId = String(body.productId ?? "");
  if (!productId) {
    return NextResponse.json({ error: "product_id_required" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId: auth.ctx.sellerId },
  });
  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (typeof body.isActive === "boolean") {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: body.isActive },
    });
  }

  if (typeof body.keywords === "string") {
    const existing = await prisma.productAttribute.findFirst({
      where: { productId, name: "whatsapp_keywords" },
    });
    const value = body.keywords.slice(0, 500);
    if (existing) {
      await prisma.productAttribute.update({
        where: { id: existing.id },
        data: { value },
      });
    } else if (value.trim()) {
      await prisma.productAttribute.create({
        data: { productId, name: "whatsapp_keywords", value },
      });
    }
  }

  const updated = await prisma.product.findFirst({
    where: { id: productId },
    include: {
      category: { select: { name: true } },
      images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      attributes: { where: { name: "whatsapp_keywords" }, take: 1 },
    },
  });

  return NextResponse.json({ product: updated ? mapProduct(updated) : null });
}
