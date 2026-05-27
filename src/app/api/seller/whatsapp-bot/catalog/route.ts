import { NextRequest, NextResponse } from "next/server";
import { requireSellerSession } from "@/lib/whatsapp-bot/auth";
import { prisma } from "@/lib/prisma";
import {
  catalogProductSelect,
  mapProductRowToHit,
} from "@/lib/whatsapp-bot/catalog-product-map";
import { getSellerStoreMeta, searchSellerProducts } from "@/lib/whatsapp-bot/product-search-service";

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
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "100", 10) || 100));
  const appBase = appBaseFromRequest(req);

  const store = await getSellerStoreMeta(auth.ctx.sellerId, appBase);

  if (q.length >= 2) {
    const hits = await searchSellerProducts(auth.ctx.sellerId, q, appBase, 80);
    const ids = hits.map((h) => h.id);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, sellerId: auth.ctx.sellerId },
      select: catalogProductSelect,
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    const mapped = hits
      .map((h) => byId.get(h.id))
      .filter(Boolean)
      .map((p) => mapProductRow(p!, appBase, store));
    return NextResponse.json({
      store,
      total: mapped.length,
      page: 1,
      pageSize: mapped.length,
      products: mapped,
    });
  }

  const where = {
    sellerId: auth.ctx.sellerId,
    ...(activeOnly ? { isActive: true } : {}),
    ...(category
      ? { category: { name: { contains: category, mode: "insensitive" as const } } }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: catalogProductSelect,
    }),
  ]);

  return NextResponse.json({
    store,
    total,
    page,
    pageSize,
    products: rows.map((p) => mapProductRow(p, appBase, store)),
  });
}

function mapProductRow(
  p: {
    id: string;
    title: string;
    sku: string | null;
    price: number;
    stock: number;
    description: string;
    isActive: boolean;
    freeShipping: boolean;
    category: { name: string };
    images: { url: string }[];
    attributes: { value: string }[];
  },
  appBase: string,
  store: { storeUrl: string | null; sellerImageUrl: string | null }
) {
  const hit = mapProductRowToHit(p, appBase);
  return {
    id: hit.id,
    title: hit.title,
    sku: hit.sku,
    price: Number(hit.price),
    stock: hit.stock,
    category: hit.category ?? p.category.name,
    description: p.description.slice(0, 300),
    imageUrl: hit.imageUrl,
    sellerImageUrl: store.sellerImageUrl,
    productUrl: hit.productUrl,
    storeUrl: store.storeUrl,
    freeShipping: hit.freeShipping,
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

  const appBase = appBaseFromRequest(req);
  const store = await getSellerStoreMeta(auth.ctx.sellerId, appBase);
  const updated = await prisma.product.findFirst({
    where: { id: productId },
    select: catalogProductSelect,
  });

  return NextResponse.json({
    product: updated ? mapProductRow(updated, appBase, store) : null,
  });
}
