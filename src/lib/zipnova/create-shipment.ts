import { prisma } from "@/lib/prisma";
import { supabaseService } from "@/lib/supabase/service";
import { readGuestClaimFromShipping } from "@/lib/orders/guest-claim";
import {
  buildItemsFromLines,
  resolveZipnovaQuoteConnection,
  type CartLineForQuote,
  type ZipnovaQuoteMeta,
} from "@/lib/zipnova/quote-cart";

/** Metadatos de cotización + creación de envío (persistido en `shipping_address.zipnova`). */
export type ZipnovaStoredQuote = ZipnovaQuoteMeta & {
  shipment_id?: number;
  shipment_external_id?: string;
  shipment_created_at?: string;
  carrier_tracking_id?: string | null;
  tracking?: string | null;
  shipment_create_failed_at?: string;
  shipment_create_error?: string;
};

function parseZipnovaBlob(shipping: unknown): ZipnovaStoredQuote | null {
  if (!shipping || typeof shipping !== "object") return null;
  const z = (shipping as Record<string, unknown>).zipnova;
  if (!z || typeof z !== "object") return null;
  const o = z as Record<string, unknown>;
  const service_type_code = typeof o.service_type_code === "string" ? o.service_type_code : "";
  const logistic_type = typeof o.logistic_type === "string" ? o.logistic_type : "";
  const carrier_id = Number(o.carrier_id);
  const sidRaw = o.shipment_id;
  const shipment_id_parsed =
    typeof sidRaw === "number"
      ? sidRaw
      : typeof sidRaw === "string" && sidRaw.trim()
        ? Number(sidRaw)
        : undefined;
  const rawPid = o.point_id == null ? null : Number(o.point_id);
  const point_id = rawPid != null && Number.isFinite(rawPid) ? rawPid : null;
  if (!service_type_code || !Number.isFinite(carrier_id)) return null;
  return {
    quoted_at: typeof o.quoted_at === "string" ? o.quoted_at : new Date().toISOString(),
    price_incl_tax: Number(o.price_incl_tax ?? 0),
    price: Number(o.price ?? 0),
    logistic_type,
    service_type_code,
    carrier_id,
    point_id,
    options_count: Number(o.options_count ?? 0),
    shipment_id: Number.isFinite(shipment_id_parsed as number) ? (shipment_id_parsed as number) : undefined,
    shipment_external_id: typeof o.shipment_external_id === "string" ? o.shipment_external_id : undefined,
    shipment_created_at: typeof o.shipment_created_at === "string" ? o.shipment_created_at : undefined,
    carrier_tracking_id:
      typeof o.carrier_tracking_id === "string" || o.carrier_tracking_id === null
        ? (o.carrier_tracking_id as string | null)
        : undefined,
    tracking: typeof o.tracking === "string" || o.tracking === null ? (o.tracking as string | null) : undefined,
  };
}

function mergeZipnovaPatch(
  shipping: Record<string, unknown>,
  patch: Partial<ZipnovaStoredQuote>
): Record<string, unknown> {
  const prev = parseZipnovaBlob(shipping);
  const baseZ = prev ? { ...prev } : {};
  return {
    ...shipping,
    zipnova: { ...baseZ, ...patch },
  };
}

/**
 * `external_id` Zipnova: alfanumérico + guiones, máx. 30 (ver docs crear envío).
 * UUID sin guiones son 32 chars → truncamos a 30.
 */
export function zipnovaExternalIdForOrder(orderId: string): string {
  const compact = orderId.replace(/-/g, "").replace(/[^a-zA-Z0-9]/g, "");
  if (compact.length >= 8) return compact.slice(0, 30);
  return `mj${orderId.replace(/[^a-zA-Z0-9]/g, "").padEnd(28, "0").slice(0, 28)}`.slice(0, 30);
}

function inferDestinationCountry(baseUrl: string): string {
  if (/zipnova\.cl\b/i.test(baseUrl)) return "CL";
  if (/zipnova\.com\.mx\b/i.test(baseUrl)) return "MX";
  return "AR";
}

async function prismaUserIdFromSupabaseProfileId(profileId: string): Promise<string | null> {
  const { data, error } = await supabaseService.from("profiles").select("email").eq("id", profileId).maybeSingle();
  if (error || !data?.email || typeof data.email !== "string") return null;
  const email = data.email.trim();
  if (!email) return null;
  const u = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  return u?.id ?? null;
}

async function fetchCartLinesForOrder(orderId: string): Promise<CartLineForQuote[] | null> {
  const { data: rows, error } = await supabaseService
    .from("order_items")
    .select("product_id, quantity, unit_price")
    .eq("order_id", orderId);
  if (error || !rows?.length) return null;
  const ids = [...new Set(rows.map((r) => String((r as { product_id?: string }).product_id ?? "")))].filter(Boolean);
  if (!ids.length) return null;
  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, sku: true, freeShipping: true },
  });
  const pmap = new Map(products.map((p) => [p.id, p]));
  const lines: CartLineForQuote[] = [];
  for (const raw of rows) {
    const r = raw as { product_id?: string; quantity?: number; unit_price?: unknown };
    const pid = r.product_id ? String(r.product_id) : "";
    const p = pmap.get(pid);
    if (!p) continue;
    lines.push({
      quantity: Math.max(1, Math.floor(Number(r.quantity ?? 1))),
      price: Number(r.unit_price ?? 0),
      product: {
        id: p.id,
        title: p.title,
        sku: p.sku,
        freeShipping: p.freeShipping,
      },
    });
  }
  return lines.length ? lines : null;
}

/**
 * Tras pago aprobado: crea envío en Zipnova si hay cotización persistida y aún no hay `shipment_id`.
 * No lanza: registra error en `shipping_address.zipnova` para soporte.
 */
export async function tryCreateZipnovaShipmentForPaidOrder(params: {
  orderId: string;
  /** Objeto `shipping_address` ya fusionado con `paid_at` u otros parches. */
  shippingAddress: Record<string, unknown>;
  sellerProfileId: string;
  declaredValue: number;
}): Promise<Record<string, unknown>> {
  const { orderId, sellerProfileId } = params;
  const shippingAddress = params.shippingAddress;

  if (orderId.startsWith("tmp_")) return { ...shippingAddress };

  const meta = parseZipnovaBlob(shippingAddress);
  if (!meta) return { ...shippingAddress };
  if (meta.shipment_id != null && Number.isFinite(meta.shipment_id)) return { ...shippingAddress };

  const sellerPrismaId = await prismaUserIdFromSupabaseProfileId(sellerProfileId);
  if (!sellerPrismaId) {
    console.warn("[zipnova] create shipment: no Prisma user for seller profile", sellerProfileId);
    return mergeZipnovaPatch(shippingAddress, {
      shipment_create_failed_at: new Date().toISOString(),
      shipment_create_error: "No se resolvió el vendedor (Prisma) para OAuth Zipnova.",
    });
  }

  const lines = await fetchCartLinesForOrder(orderId);
  if (!lines?.length) {
    console.warn("[zipnova] create shipment: sin order_items para orden", orderId);
    return mergeZipnovaPatch(shippingAddress, {
      shipment_create_failed_at: new Date().toISOString(),
      shipment_create_error: "Sin ítems de pedido para armar el envío.",
    });
  }

  const conn = await resolveZipnovaQuoteConnection(sellerPrismaId);
  if (!conn) {
    return mergeZipnovaPatch(shippingAddress, {
      shipment_create_failed_at: new Date().toISOString(),
      shipment_create_error: "Zipnova no configurado (ni marketplace ni OAuth vendedor).",
    });
  }

  const guest = readGuestClaimFromShipping(shippingAddress);
  const email = guest?.email?.trim();
  const phoneRaw = (guest?.phone ?? (shippingAddress.phone as string | undefined))?.trim() || "";
  const phone = phoneRaw.replace(/\s+/g, " ").slice(0, 50) || "0000000000";
  const document =
    (guest?.document ?? "").trim() ||
    (typeof shippingAddress.document === "string" ? shippingAddress.document.trim() : "") ||
    "0";
  const recipient =
    (typeof shippingAddress.recipient === "string" && shippingAddress.recipient.trim()) ||
    "Destinatario";

  if (!email) {
    return mergeZipnovaPatch(shippingAddress, {
      shipment_create_failed_at: new Date().toISOString(),
      shipment_create_error: "Falta email del destinatario (guest_claim / checkout).",
    });
  }

  const city = String(shippingAddress.city ?? "").trim();
  const state = String(shippingAddress.state ?? "").trim();
  const zipcode = String(shippingAddress.zip ?? "").replace(/\s+/g, "").trim();
  const street = String(shippingAddress.street ?? "").trim();
  const streetNumber = String(shippingAddress.number ?? "").trim();
  const apartment = String(shippingAddress.apartment ?? "").trim();

  const country = inferDestinationCountry(conn.baseUrl);
  const usePickup = meta.point_id != null && Number.isFinite(meta.point_id);

  const destination: Record<string, unknown> = {
    name: recipient.slice(0, 100),
    document: document.slice(0, 50),
    email: email.slice(0, 150),
    phone: phone.slice(0, 50),
    country,
  };

  if (usePickup) {
    destination.point_id = meta.point_id;
  } else {
    if (!city || !state || !street || !streetNumber) {
      return mergeZipnovaPatch(shippingAddress, {
        shipment_create_failed_at: new Date().toISOString(),
        shipment_create_error: "Dirección incompleta para envío a domicilio (calle/número/ciudad/provincia).",
      });
    }
    destination.city = city.slice(0, 100);
    destination.state = state.slice(0, 100);
    destination.street = street.slice(0, 100);
    destination.street_number = streetNumber.slice(0, 10);
    if (zipcode) destination.zipcode = zipcode.slice(0, 10);
    if (apartment) destination.street_extras = apartment.slice(0, 120);
  }

  const items = buildItemsFromLines(lines);
  if (!items.length) {
    return { ...shippingAddress };
  }

  const externalId = zipnovaExternalIdForOrder(orderId);
  const originId = conn.originId != null && conn.originId > 0 ? String(conn.originId) : "auto";

  const body: Record<string, unknown> = {
    account_id: conn.accountId,
    external_id: externalId,
    service_type: meta.service_type_code,
    declared_value: Math.max(0, params.declaredValue),
    origin_id: originId,
    source: conn.source,
    type_packaging: "dynamic",
    destination,
    items,
    process_immediately: 0,
  };
  if (meta.logistic_type) body.logistic_type = meta.logistic_type;
  if (Number.isFinite(meta.carrier_id)) body.carrier_id = meta.carrier_id;

  const url = `${conn.baseUrl}/shipments`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: conn.authorization,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        typeof json.message === "string"
          ? json.message
          : typeof json.error === "string"
            ? json.error
            : `Zipnova crear envío HTTP ${res.status}`;
      console.error("[zipnova] create shipment failed:", orderId, msg, json);
      return mergeZipnovaPatch(shippingAddress, {
        shipment_create_failed_at: new Date().toISOString(),
        shipment_create_error: msg.slice(0, 500),
      });
    }

    const id = typeof json.id === "number" ? json.id : Number(json.id);
    if (!Number.isFinite(id)) {
      return mergeZipnovaPatch(shippingAddress, {
        shipment_create_failed_at: new Date().toISOString(),
        shipment_create_error: "Respuesta Zipnova sin id de envío válido.",
      });
    }

    const tracking =
      typeof json.tracking === "string" || json.tracking === null ? (json.tracking as string | null) : null;
    const carrier_tracking_id =
      typeof json.carrier_tracking_id === "string" || json.carrier_tracking_id === null
        ? (json.carrier_tracking_id as string | null)
        : null;

    return mergeZipnovaPatch(shippingAddress, {
      shipment_id: id,
      shipment_external_id: externalId,
      shipment_created_at: new Date().toISOString(),
      carrier_tracking_id,
      tracking,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de red al crear envío Zipnova";
    console.error("[zipnova] create shipment exception:", orderId, e);
    return mergeZipnovaPatch(shippingAddress, {
      shipment_create_failed_at: new Date().toISOString(),
      shipment_create_error: msg.slice(0, 500),
    });
  }
}
