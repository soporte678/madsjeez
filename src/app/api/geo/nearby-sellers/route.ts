/**
 * GET /api/geo/nearby-sellers?lat=&lng=&radius=&limit=&offset=
 *
 * Vendedores cercanos al comprador, ordenados por distancia. Usa la RPC
 * PostGIS nearby_sellers (filtra y ordena en la base, no en JS). Solo
 * devuelve coordenadas PÚBLICAS.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { checkRateLimit, clientIpFromRequest } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function num(v: string | null, def: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function GET(req: Request) {
  // Rate-limit por IP: la RPC PostGIS es costosa y el endpoint es público.
  const rl = checkRateLimit(`geo:${clientIpFromRequest(req)}`, { max: 40, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  const radius = Math.min(Math.max(num(searchParams.get("radius"), 25), 1), 200);
  const limit = Math.min(Math.max(num(searchParams.get("limit"), 50), 1), 200);
  const offset = Math.max(num(searchParams.get("offset"), 0), 0);

  const { data, error } = await supabaseService.rpc("nearby_sellers", {
    buyer_lat: lat,
    buyer_lng: lng,
    radius_km: radius,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error("nearby-sellers:", error);
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  }
  return NextResponse.json({ sellers: data ?? [] });
}
