/**
 * /api/seller/location
 *
 * GET  → devuelve la ubicación COMPLETA del vendedor autenticado (para editar).
 *        Solo el dueño ve sus coordenadas privadas.
 * PUT  → guarda/actualiza la ubicación. Las coordenadas privadas llegan acá
 *        (server-side), se computan las públicas y se persiste vía RPC
 *        SECURITY DEFINER. El comprador nunca ve coords privadas.
 *
 * Privacidad: la tabla seller_locations tiene RLS y solo es accesible por
 * service role. El público lee la vista public_seller_locations.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const VISIBILITIES = ["exact", "approximate", "locality_only", "hidden"] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { data, error } = await supabaseService
    .from("seller_locations")
    .select(
      "place_id, formatted_address, street_name, street_number, neighborhood, locality, administrative_area_level_1, administrative_area_level_2, postal_code, country_code, latitude, longitude, location_visibility, service_radius_km, pickup_enabled, local_delivery_enabled, nationwide_shipping_enabled, flash_enabled, instructions, geo_status, address_verified",
    )
    .eq("seller_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.error("GET seller/location:", error);
    return NextResponse.json({ error: "Error consultando ubicación" }, { status: 500 });
  }
  return NextResponse.json({ location: data ?? null });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!session.user.isSeller) {
    return NextResponse.json({ error: "Solo vendedores" }, { status: 403 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const lat = Number(b.latitude);
  const lng = Number(b.longitude);
  const visibility = String(b.location_visibility || "approximate");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }
  if (!VISIBILITIES.includes(visibility as (typeof VISIBILITIES)[number])) {
    return NextResponse.json({ error: "Nivel de privacidad inválido" }, { status: 400 });
  }

  const { error } = await supabaseService.rpc("upsert_seller_location", {
    p_seller_id: session.user.id,
    p_place_id: (b.place_id as string) ?? null,
    p_formatted_address: (b.formatted_address as string) ?? null,
    p_street_name: (b.street_name as string) ?? null,
    p_street_number: (b.street_number as string) ?? null,
    p_neighborhood: (b.neighborhood as string) ?? null,
    p_locality: (b.locality as string) ?? null,
    p_admin1: (b.administrative_area_level_1 as string) ?? null,
    p_admin2: (b.administrative_area_level_2 as string) ?? null,
    p_postal_code: (b.postal_code as string) ?? null,
    p_country_code: (b.country_code as string) ?? "AR",
    p_lat: lat,
    p_lng: lng,
    p_visibility: visibility,
    p_service_radius_km: b.service_radius_km != null ? Number(b.service_radius_km) : 0,
    p_pickup: Boolean(b.pickup_enabled),
    p_local_delivery: Boolean(b.local_delivery_enabled),
    p_nationwide: b.nationwide_shipping_enabled == null ? true : Boolean(b.nationwide_shipping_enabled),
    p_flash: Boolean(b.flash_enabled),
    p_instructions: (b.instructions as string) ?? null,
    p_actor_id: session.user.id,
  });

  if (error) {
    console.error("PUT seller/location:", error);
    return NextResponse.json({ error: "No se pudo guardar la ubicación" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
