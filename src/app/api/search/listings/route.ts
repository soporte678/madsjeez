import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { hasValidProductImageUrl } from "@/lib/productVisibility";

export const dynamic = "force-dynamic";

type UnifiedProduct = {
  id: string;
  title: string;
  price: number;
  original_price: number | null;
  condition: string;
  shipping_free: boolean;
  sales: number;
  sold_count: number;
  meli_item_id?: string | null;
  primary_image: string | null;
  seller_name: string | null;
  seller_id: string | null;
  category_name: string | null;
  is_promoted?: boolean;
  created_at?: string | null;
};

function mapSupabaseRow(p: Record<string, unknown>): UnifiedProduct {
  const imgs = p.product_images as Array<{ url?: string; is_primary?: boolean }> | undefined;
  const primary =
    imgs?.find((img) => img.is_primary)?.url || imgs?.[0]?.url || null;
  const profiles = p.profiles as { full_name?: string } | undefined;
  const cats = p.categories as { name?: string } | undefined;

  return {
    id: String(p.id),
    title: String(p.title ?? ""),
    price: Number(p.price ?? 0),
    original_price:
      p.original_price !== undefined && p.original_price !== null
        ? Number(p.original_price)
        : null,
    condition: String(p.condition ?? "new"),
    shipping_free: Boolean(p.shipping_free),
    sales: Number(p.sales ?? p.sold_count ?? 0),
    sold_count: Number(p.sold_count ?? p.sales ?? 0),
    meli_item_id: (p.meli_item_id as string) ?? null,
    primary_image: typeof primary === "string" ? primary.trim() : null,
    seller_name: profiles?.full_name ?? null,
    seller_id: (p.seller_id as string) ?? null,
    category_name: cats?.name ?? null,
    is_promoted: Boolean(p.is_promoted),
    created_at: (p.created_at as string) ?? null,
  };
}

function mapPrismaProduct(p: {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  condition: string;
  freeShipping: boolean;
  sales: number;
  meliItemId: string | null;
  createdAt: Date;
  isBoosted: boolean;
  seller: { id: string; name: string | null; sellerName: string | null };
  category: { name: string };
  images: Array<{ url: string }>;
}): UnifiedProduct {
  return {
    id: p.id,
    title: p.title,
    price: p.price,
    original_price: p.originalPrice,
    condition: p.condition,
    shipping_free: p.freeShipping,
    sales: p.sales,
    sold_count: p.sales,
    meli_item_id: p.meliItemId,
    primary_image: p.images[0]?.url?.trim() ?? null,
    seller_name: p.seller.sellerName || p.seller.name || null,
    seller_id: p.seller.id,
    category_name: p.category.name,
    is_promoted: p.isBoosted,
    created_at: p.createdAt.toISOString(),
  };
}

function sortUnified(products: UnifiedProduct[], sort: string): UnifiedProduct[] {
  const arr = [...products];
  switch (sort) {
    case "price_asc":
      arr.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      arr.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      arr.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      break;
    default:
      arr.sort((a, b) => Number(b.is_promoted) - Number(a.is_promoted));
  }
  return arr;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    const cond = searchParams.get("condition");
    const sort = searchParams.get("sort") || "relevance";
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const freeShip = searchParams.get("free_shipping");
    const limit = Math.min(parseInt(searchParams.get("limit") || "48", 10) || 48, 96);

    // Hint explícito al FK hacia profiles; si usamos `profiles:seller_id` PostgREST a veces
    // resuelve otro FK (p. ej. users) y falla con "full_name does not exist".
    const baseSelect = `
        *,
        product_images(url),
        profiles!products_seller_id_fkey(full_name),
        categories!products_category_id_fkey(name)
      `;

    let sbQuery = supabaseService
      .from("products")
      .select(baseSelect)
      .eq("is_active", true);

    if (q) sbQuery = sbQuery.ilike("title", `%${q}%`);
    if (cat) sbQuery = sbQuery.eq("category_id", cat);
    if (cond) sbQuery = sbQuery.eq("condition", cond);
    if (minPrice) sbQuery = sbQuery.gte("price", parseInt(minPrice, 10));
    if (maxPrice) sbQuery = sbQuery.lte("price", parseInt(maxPrice, 10));
    if (freeShip === "true") sbQuery = sbQuery.eq("shipping_free", true);

    switch (sort) {
      case "price_asc":
        sbQuery = sbQuery.order("price", { ascending: true });
        break;
      case "price_desc":
        sbQuery = sbQuery.order("price", { ascending: false });
        break;
      case "newest":
        sbQuery = sbQuery.order("created_at", { ascending: false });
        break;
      default:
        sbQuery = sbQuery.order("is_promoted", { ascending: false });
    }

    const { data: sbData, error: sbErr } = await sbQuery.limit(limit);
    if (sbErr) {
      console.error("search/listings supabase:", sbErr);
    }

    const prismaWhere: Prisma.ProductWhereInput = { isActive: true };
    if (q) prismaWhere.title = { contains: q, mode: "insensitive" };
    if (cat) prismaWhere.categoryId = cat;
    if (cond) prismaWhere.condition = cond;
    const priceRange: Prisma.FloatFilter = {};
    if (minPrice) priceRange.gte = parseFloat(minPrice);
    if (maxPrice) priceRange.lte = parseFloat(maxPrice);
    if (Object.keys(priceRange).length > 0) prismaWhere.price = priceRange;
    if (freeShip === "true") prismaWhere.freeShipping = true;

    const prismaRows = await prisma.product.findMany({
      where: prismaWhere,
      take: limit,
      include: {
        seller: { select: { id: true, name: true, sellerName: true } },
        category: { select: { name: true } },
        images: { orderBy: { order: "asc" }, take: 5 },
      },
      orderBy:
        sort === "price_asc"
          ? { price: "asc" }
          : sort === "price_desc"
            ? { price: "desc" }
            : sort === "newest"
              ? { createdAt: "desc" }
              : [{ isBoosted: "desc" }, { updatedAt: "desc" }],
    });

    const prismaUnified = prismaRows.map(mapPrismaProduct);
    const prismaByMeli = new Map<string, UnifiedProduct>();
    for (const u of prismaUnified) {
      if (u.meli_item_id) prismaByMeli.set(u.meli_item_id, u);
    }

    const sbList = (sbData || []).map((row: Record<string, unknown>) =>
      mapSupabaseRow(row)
    );
    const sbFiltered = sbList.filter((row) => {
      if (!row.meli_item_id) return true;
      return !prismaByMeli.has(row.meli_item_id);
    });

    const mergedMap = new Map<string, UnifiedProduct>();
    for (const u of prismaUnified) mergedMap.set(`p:${u.id}`, u);
    for (const u of sbFiltered) mergedMap.set(`s:${u.id}`, u);

    let merged = Array.from(mergedMap.values()).filter((row) =>
      hasValidProductImageUrl(row.primary_image)
    );
    merged = sortUnified(merged, sort).slice(0, limit);

    return NextResponse.json({ products: merged });
  } catch (e) {
    console.error("GET /api/search/listings:", e);
    return NextResponse.json({ error: "Error al cargar resultados" }, { status: 500 });
  }
}
