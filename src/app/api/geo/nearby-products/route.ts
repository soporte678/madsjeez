/**
 * GET /api/geo/nearby-products?lat=&lng=&radius=&category=&q=&minPrice=&maxPrice=&pickup=&flash=&limit=&offset=
 *
 * Productos activos de vendedores dentro del radio, ordenados por distancia.
 * Filtra/ordena en PostGIS (RPC nearby_products). Solo coordenadas públicas.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function num(v: string | null, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  const radius = Math.min(Math.max(num(searchParams.get("radius"), 25), 1), 200);
  const limit = Math.min(Math.max(num(searchParams.get("limit"), 40), 1), 100);
  const offset = Math.max(num(searchParams.get("offset"), 0), 0);
  const minP = searchParams.get("minPrice");
  const maxP = searchParams.get("maxPrice");

  const { data, error } = await supabaseService.rpc("nearby_products", {
    buyer_lat: lat,
    buyer_lng: lng,
    radius_km: radius,
    p_category_id: searchParams.get("category") || null,
    p_search: searchParams.get("q") || null,
    p_min_price: minP ? Number(minP) : null,
    p_max_price: maxP ? Number(maxP) : null,
    p_pickup_only: searchParams.get("pickup") === "true",
    p_flash_only: searchParams.get("flash") === "true",
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("nearby-products:", error);
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  }
  return NextResponse.json({ products: data ?? [] });
}
