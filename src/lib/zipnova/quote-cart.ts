import type { ZipnovaConfig } from "@/lib/zipnova/config";
import { getZipnovaConfig, zipnovaBasicAuthHeader } from "@/lib/zipnova/config";

/** Valores por defecto si el catálogo no tiene medidas (hasta que el seller cargue datos reales). */
const DEFAULT_WEIGHT_G = 500;
const DEFAULT_CM = 25;

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

function buildItemsFromLines(lines: CartLineForQuote[]): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  for (const line of lines) {
    if (line.product.freeShipping) continue;
    const sku = (line.product.sku || line.product.id).slice(0, 190);
    const desc = line.product.title.slice(0, 190);
    for (let q = 0; q < line.quantity; q += 1) {
      items.push({
        sku,
        weight: DEFAULT_WEIGHT_G,
        height: DEFAULT_CM,
        width: DEFAULT_CM,
        length: DEFAULT_CM,
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
  cfg: ZipnovaConfig,
  input: {
    destination: ShippingAddressForQuote;
    declaredValue: number;
    items: Array<Record<string, unknown>>;
  }
): Promise<{ cost: number; meta: ZipnovaQuoteMeta; rawSample: unknown }> {
  const city = String(input.destination.city ?? "").trim();
  const state = String(input.destination.state ?? "").trim();
  const zipcode = String(input.destination.zip ?? "").trim();
  if (!city || !state) {
    throw new Error("Zipnova: faltan ciudad o provincia para cotizar");
  }

  const body: Record<string, unknown> = {
    account_id: cfg.accountId,
    source: cfg.source,
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
  };
  if (cfg.originId != null) {
    body.origin_id = cfg.originId;
  }

  const url = `${cfg.baseUrl}/shipments/quote`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: zipnovaBasicAuthHeader(cfg),
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
 * - Sin Zipnova configurado → costo fijo legacy (2500) si hay ítems con envío
 * - Con Zipnova → cotización real; si falla, lanza (el caller puede convertir en 502)
 */
export async function resolveCartShippingCost(params: {
  lines: CartLineForQuote[];
  shipping: ShippingAddressForQuote;
  /** Si false, nunca llama a Zipnova (útil en tests). */
  allowZipnova?: boolean;
}): Promise<ResolveShippingResult> {
  const needsShipping = params.lines.some((l) => !l.product.freeShipping);
  if (!needsShipping) {
    return { cost: 0, zipnova: null, usedZipnova: false };
  }

  const cfg = params.allowZipnova === false ? null : getZipnovaConfig();
  if (!cfg) {
    return { cost: 2500, zipnova: null, usedZipnova: false };
  }

  const items = buildItemsFromLines(params.lines);
  if (!items.length) {
    return { cost: 0, zipnova: null, usedZipnova: false };
  }

  const declared = params.lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const { cost, meta } = await requestZipnovaQuote(cfg, {
    destination: params.shipping,
    declaredValue: declared,
    items,
  });

  return { cost, zipnova: meta, usedZipnova: true };
}
