import type { ZipnovaConfig } from "@/lib/zipnova/config";
import { getZipnovaConfig, zipnovaBasicAuthHeader } from "@/lib/zipnova/config";
import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMissingError } from "@/lib/prisma/known-errors";
import { refreshZipnovaAccessToken } from "@/lib/zipnova/oauth-marketplace";

/** Valores por defecto si el catálogo no tiene medidas (hasta que el seller cargue datos reales). */
const DEFAULT_WEIGHT_G = 500;
const DEFAULT_CM = 25;

const ZIPNOVA_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export type CartLineForQuote = {
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    sku: string | null;
    freeShipping: boolean;
  };
};

export type ShippingAddressForQuote = {
  city?: string;
  state?: string;
  zip?: string;
  street?: string;
  number?: string;
};

export type ZipnovaQuoteMeta = {
  quoted_at: string;
  price_incl_tax: number;
  price: number;
  logistic_type: string;
  service_type_code: string;
  carrier_id: number;
  point_id: number | null;
  /** Resumen para soporte / trazabilidad (no guardar payload completo). */
  options_count: number;
};

export type ZipnovaQuoteConnection = {
  baseUrl: string;
  accountId: number;
  source: string;
  originId: number | null;
  authorization: string;
};

type QuoteResultRow = {
  selectable?: boolean;
  impediments?: unknown;
  logistic_type?: string;
  service_type?: { code?: string; name?: string };
  carrier?: { id?: number; name?: string };
  amounts?: {
    price?: number;
    price_incl_tax?: number;
    price_shipment?: number;
  };
  pickup_points?: Array<{ point_id?: number }>;
};

function defaultZipnovaBaseUrl(): string {
  return (process.env.ZIPNOVA_API_BASE_URL || "https://api.zipnova.com.ar/v2").replace(/\/$/, "");
}

function defaultZipnovaSource(): string {
  return (process.env.ZIPNOVA_SOURCE || "madsjeez_marketplace").slice(0, 150);
}

function isArgentinaZipnovaApi(baseUrl: string): boolean {
  return /zipnova\.com\.ar/i.test(baseUrl);
}

/** CP: sin espacios extra (Zipnova usa CP para tarifar por zona en AR). */
function normalizePostalCode(zip: string): string {
  return zip.replace(/\s+/g, "").trim();
}

function connectionFromBasic(cfg: ZipnovaConfig): ZipnovaQuoteConnection {
  return {
    baseUrl: cfg.baseUrl,
    accountId: cfg.accountId,
    source: cfg.source,
    originId: cfg.originId,
    authorization: zipnovaBasicAuthHeader(cfg),
  };
}

/**
 * Primera cuenta accesible con el token OAuth (para armar `account_id` en /shipments/quote).
 */
export async function fetchZipnovaFirstAccountId(
  baseUrl: string,
  accessToken: string
): Promise<number | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/accounts`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = (await res.json().catch(() => ({}))) as {
    data?: Array<{ id?: number }>;
  };
  if (!res.ok) return null;
  const id = json.data?.[0]?.id;
  return typeof id === "number" && Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Credenciales para cotizar: OAuth del vendedor (origen/cuenta real) si está conectado;
 * si no, credenciales Basic del marketplace (`ZIPNOVA_*`).
 */
export async function resolveZipnovaQuoteConnection(
  sellerUserId?: string | null
): Promise<ZipnovaQuoteConnection | null> {
  const basic = getZipnovaConfig();
  const baseUrl = basic?.baseUrl ?? defaultZipnovaBaseUrl();
  const source = basic?.source ?? defaultZipnovaSource();
  const originId = basic?.originId ?? null;

  if (!sellerUserId?.trim()) {
    if (!basic) return null;
    return connectionFromBasic(basic);
  }

  try {
    const row = await prisma.sellerZipnovaOAuth.findUnique({
      where: { userId: sellerUserId.trim() },
    });

    if (!row?.accessToken?.trim()) {
      if (!basic) return null;
      return connectionFromBasic(basic);
    }

    let accessToken = row.accessToken.trim();
    let refreshTok = row.refreshToken?.trim() ?? null;
    let expiresAt = row.expiresAt;

    if (expiresAt.getTime() < Date.now() + ZIPNOVA_EXPIRY_BUFFER_MS && refreshTok) {
      try {
        const t = await refreshZipnovaAccessToken(refreshTok);
        accessToken = t.access_token;
        refreshTok = (t.refresh_token ?? refreshTok).trim();
        expiresAt = new Date(Date.now() + Math.max(60, t.expires_in) * 1000);
        await prisma.sellerZipnovaOAuth.update({
          where: { userId: row.userId },
          data: {
            accessToken,
            refreshToken: refreshTok || null,
            expiresAt,
          },
        });
      } catch (e) {
        console.error("[zipnova] refresh seller token:", e);
        if (!basic) return null;
        return connectionFromBasic(basic);
      }
    }

    let accountId = row.zipnovaAccountId;
    if (accountId == null || accountId <= 0) {
      const fetched = await fetchZipnovaFirstAccountId(baseUrl, accessToken);
      if (fetched != null) {
        accountId = fetched;
        await prisma.sellerZipnovaOAuth
          .update({
            where: { userId: row.userId },
            data: { zipnovaAccountId: fetched },
          })
          .catch(() => undefined);
      }
    }

    if (accountId != null && accountId > 0) {
      return {
        baseUrl,
        accountId,
        source,
        originId,
        authorization: `Bearer ${accessToken}`,
      };
    }

    if (basic) return connectionFromBasic(basic);
    return null;
  } catch (e) {
    if (isPrismaSchemaMissingError(e)) {
      console.warn(
        "[zipnova] Tabla seller_zipnova_oauth inexistente (migrate deploy pendiente). Cotización con credenciales marketplace si existen."
      );
    } else {
      console.error("[zipnova] resolveZipnovaQuoteConnection:", e);
    }
    if (!basic) return null;
    return connectionFromBasic(basic);
  }
}

/** Expuesto para armar el mismo payload de ítems en creación de envío (`POST /shipments`). */
export function buildItemsFromLines(lines: CartLineForQuote[]): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  const w = Math.round(DEFAULT_WEIGHT_G);
  const dim = Math.round(DEFAULT_CM);
  for (const line of lines) {
    if (line.product.freeShipping) continue;
    const sku = (line.product.sku || line.product.id).slice(0, 190);
    const desc = line.product.title.slice(0, 190);
    for (let q = 0; q < line.quantity; q += 1) {
      items.push({
        sku,
        weight: w,
        height: dim,
        width: dim,
        length: dim,
        description: desc,
        classification_id: "1",
      });
    }
  }
  return items;
}

/**
 * Llama POST /shipments/quote y elige la opción seleccionable más barata (price_incl_tax o price).
 */
export async function requestZipnovaQuote(
  conn: ZipnovaQuoteConnection,
  input: {
    destination: ShippingAddressForQuote;
    declaredValue: number;
    items: Array<Record<string, unknown>>;
  }
): Promise<{ cost: number; meta: ZipnovaQuoteMeta; rawSample: unknown }> {
  const city = String(input.destination.city ?? "").trim();
  const state = String(input.destination.state ?? "").trim();
  const zipcode = normalizePostalCode(String(input.destination.zip ?? ""));
  if (!city || !state) {
    throw new Error("Zipnova: faltan ciudad o provincia para cotizar");
  }
  if (isArgentinaZipnovaApi(conn.baseUrl) && !zipcode) {
    throw new Error(
      "Zipnova: el código postal es obligatorio para cotizar por zona en Argentina (completá CP en el checkout)."
    );
  }

  const body: Record<string, unknown> = {
    account_id: conn.accountId,
    source: conn.source,
    declared_value: Math.max(0, input.declaredValue),
    destination: {
      city,
      state,
      ...(zipcode ? { zipcode } : {}),
      ...(input.destination.street?.trim()
        ? { street: String(input.destination.street).trim().slice(0, 100) }
        : {}),
      ...(input.destination.number?.trim()
        ? { street_number: String(input.destination.number).trim().slice(0, 10) }
        : {}),
    },
    items: input.items,
    sort_by: "price",
    type_packaging: "dynamic",
  };
  if (conn.originId != null) {
    body.origin_id = conn.originId;
  }

  const url = `${conn.baseUrl}/shipments/quote`;
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
          : `Zipnova HTTP ${res.status}`;
    throw new Error(`Zipnova: ${msg}`);
  }

  const all = (Array.isArray(json.all_results) ? json.all_results : []) as QuoteResultRow[];
  const candidates = all.filter((r) => r && r.selectable !== false && r.amounts);
  if (!candidates.length) {
    throw new Error("Zipnova: no hay opciones de envío seleccionables para este destino");
  }

  let best: QuoteResultRow | null = null;
  let bestPrice = Infinity;
  for (const r of candidates) {
    const p = Number(r.amounts?.price_incl_tax ?? r.amounts?.price ?? NaN);
    if (!Number.isFinite(p)) continue;
    if (p < bestPrice) {
      bestPrice = p;
      best = r;
    }
  }
  if (!best || !Number.isFinite(bestPrice)) {
    throw new Error("Zipnova: no se pudo calcular el precio de envío");
  }

  const stCode = String(best.service_type?.code ?? "");
  const carrierId = Number(best.carrier?.id);
  if (!stCode || !Number.isFinite(carrierId)) {
    throw new Error("Zipnova: respuesta incompleta (service_type / carrier)");
  }

  const lt = String(best.logistic_type ?? "");
  let pointId: number | null = null;
  const pts = best.pickup_points as Array<{ point_id?: number }> | undefined;
  if (Array.isArray(pts) && pts[0]?.point_id != null) {
    pointId = Number(pts[0].point_id);
    if (!Number.isFinite(pointId)) pointId = null;
  }

  const meta: ZipnovaQuoteMeta = {
    quoted_at: new Date().toISOString(),
    price_incl_tax: Number(best.amounts?.price_incl_tax ?? bestPrice),
    price: Number(best.amounts?.price ?? bestPrice),
    logistic_type: lt,
    service_type_code: stCode,
    carrier_id: carrierId,
    point_id: pointId,
    options_count: all.length,
  };

  return {
    cost: Math.max(0, Math.round(bestPrice * 100) / 100),
    meta,
    rawSample: { destination: json.destination, sorted_by: json.sorted_by },
  };
}

export type ResolveShippingResult = {
  cost: number;
  zipnova: ZipnovaQuoteMeta | null;
  /** true si se usó cotización Zipnova; false si fallback fijo o gratis */
  usedZipnova: boolean;
};

/**
 * Resuelve el costo total de envío del carrito (lado servidor).
 * - Todo con free shipping → 0
 * - Sin credenciales Zipnova (ni marketplace ni OAuth del vendedor) → costo fijo legacy (2500) si hay ítems con envío
 * - Con Zipnova → cotización por destino (CP obligatorio en AR); si el vendedor conectó OAuth, se usa su cuenta/origen para tarifar por zona.
 */
export async function resolveCartShippingCost(params: {
  lines: CartLineForQuote[];
  shipping: ShippingAddressForQuote;
  /** User.id (Prisma) del vendedor del carrito; habilita cotización con OAuth Zipnova del seller. */
  sellerUserId?: string | null;
  /** Si false, nunca llama a Zipnova (útil en tests). */
  allowZipnova?: boolean;
}): Promise<ResolveShippingResult> {
  const needsShipping = params.lines.some((l) => !l.product.freeShipping);
  if (!needsShipping) {
    return { cost: 0, zipnova: null, usedZipnova: false };
  }

  const items = buildItemsFromLines(params.lines);
  if (!items.length) {
    return { cost: 0, zipnova: null, usedZipnova: false };
  }

  if (params.allowZipnova === false) {
    return { cost: 2500, zipnova: null, usedZipnova: false };
  }

  const conn = await resolveZipnovaQuoteConnection(params.sellerUserId);
  if (!conn) {
    return { cost: 2500, zipnova: null, usedZipnova: false };
  }

  const declared = params.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const { cost, meta } = await requestZipnovaQuote(conn, {
    destination: params.shipping,
    declaredValue: declared,
    items,
  });

  return { cost, zipnova: meta, usedZipnova: true };
}
