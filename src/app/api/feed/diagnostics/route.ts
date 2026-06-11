/**
 * GET /api/feed/diagnostics  (admin)
 *
 * Diagnóstico del feed de Google Merchant: cuántos productos entran y cuáles
 * quedan excluidos y por qué (sin imagen / sin precio / sin stock). Permite
 * al equipo corregir antes de que Google los rechace.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdminRequest(req);
  if (admin instanceof NextResponse) return admin;

  const { data: products, error } = await supabaseService
    .from("products")
    .select('id, title, price, stock, is_active, product_images(url)')
    .eq("is_active", true)
    .limit(10000);
  if (error) return NextResponse.json({ error: "Error" }, { status: 500 });

  let eligible = 0;
  const noImage: { id: string; title: string }[] = [];
  const noPrice: { id: string; title: string }[] = [];
  const noStock: { id: string; title: string }[] = [];

  for (const p of products ?? []) {
    const hasImg = ((p.product_images as { url: string }[]) || []).some((im) => /^https?:\/\//i.test(im.url));
    const hasPrice = Number(p.price) > 0;
    const hasStock = Number(p.stock) > 0;
    if (!hasStock) noStock.push({ id: p.id, title: p.title });
    else if (!hasImg) noImage.push({ id: p.id, title: p.title });
    else if (!hasPrice) noPrice.push({ id: p.id, title: p.title });
    else eligible++;
  }

  return NextResponse.json({
    totalActive: (products ?? []).length,
    eligibleForFeed: eligible,
    excluded: {
      sinStock: { count: noStock.length, sample: noStock.slice(0, 20) },
      sinImagen: { count: noImage.length, sample: noImage.slice(0, 20) },
      sinPrecio: { count: noPrice.length, sample: noPrice.slice(0, 20) },
    },
    feedUrl: "https://www.madsjeez.com.ar/api/feed/google-merchant.xml",
  });
}
