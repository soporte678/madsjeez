/**
 * Conectores de tiendas externas — traen productos vía API y los mapean a
 * NormalizedRow (el mismo shape que usa el importador por CSV).
 *
 * Métodos de conexión por plataforma:
 *   - WooCommerce: storeUrl + consumerKey + consumerSecret (REST API, sin OAuth)
 *   - Shopify:     storeDomain + adminToken (Admin API, custom app token)
 *   - Tienda Nube: storeId + accessToken (obtenidos por OAuth)
 *   - Empretienda: sin API pública confirmada → usar importación por CSV
 */

import type { NormalizedRow } from "@/lib/import/platforms";

export type ConnectorPlatform = "woocommerce" | "shopify" | "tiendanube";

export type StoreCredentials = {
  // WooCommerce
  storeUrl?: string;
  consumerKey?: string;
  consumerSecret?: string;
  // Shopify
  storeDomain?: string;
  adminToken?: string;
  // Tienda Nube
  storeId?: string;
  accessToken?: string;
};

function num(v: unknown): number {
  const n = parseFloat(String(v ?? "").replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function clean(html: unknown): string {
  return String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ----------------------------- WooCommerce ----------------------------- */

async function fetchWoo(creds: StoreCredentials): Promise<NormalizedRow[]> {
  const base = (creds.storeUrl || "").replace(/\/+$/, "");
  if (!base || !creds.consumerKey || !creds.consumerSecret) {
    throw new Error("Faltan datos de WooCommerce (URL, consumer key/secret)");
  }
  const auth = Buffer.from(`${creds.consumerKey}:${creds.consumerSecret}`).toString("base64");
  const out: NormalizedRow[] = [];
  for (let page = 1; page <= 50; page++) {
    const url = `${base}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish`;
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (!res.ok) {
      if (page === 1) throw new Error(`WooCommerce respondió ${res.status}. Revisá URL y claves.`);
      break;
    }
    const items = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(items) || items.length === 0) break;
    for (const p of items) {
      const regular = num(p.regular_price ?? p.price);
      const sale = num(p.sale_price);
      const price = sale > 0 && sale < regular ? sale : regular || num(p.price);
      out.push({
        externalId: String(p.id ?? ""),
        title: String(p.name ?? "").trim(),
        description: clean(p.description ?? p.short_description),
        price,
        originalPrice: sale > 0 && sale < regular ? regular : null,
        stock: Math.round(num(p.stock_quantity)),
        sku: (p.sku as string) || null,
        condition: "new",
        freeShipping: false,
        isActive: p.status === "publish",
        category: Array.isArray(p.categories) && p.categories[0]
          ? String((p.categories[0] as { name?: string }).name ?? "")
          : null,
        images: Array.isArray(p.images)
          ? (p.images as { src?: string }[]).map((im) => String(im.src ?? "")).filter((u) => /^https?:/i.test(u))
          : [],
      });
    }
    if (items.length < 100) break;
  }
  return out;
}

/* ------------------------------- Shopify ------------------------------- */

async function fetchShopify(creds: StoreCredentials): Promise<NormalizedRow[]> {
  let domain = (creds.storeDomain || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!domain) throw new Error("Falta el dominio de Shopify (ej: mitienda.myshopify.com)");
  if (!domain.includes(".")) domain = `${domain}.myshopify.com`;
  if (!creds.adminToken) throw new Error("Falta el Admin API access token de Shopify");

  const out: NormalizedRow[] = [];
  let url: string | null =
    `https://${domain}/admin/api/2024-01/products.json?limit=250&status=active`;
  let guard = 0;
  while (url && guard++ < 50) {
    const res: Response = await fetch(url, {
      headers: { "X-Shopify-Access-Token": creds.adminToken },
    });
    if (!res.ok) {
      if (guard === 1) throw new Error(`Shopify respondió ${res.status}. Revisá dominio y token.`);
      break;
    }
    const data = (await res.json()) as { products?: Record<string, unknown>[] };
    const products = data.products || [];
    for (const p of products) {
      const variants = (p.variants as Record<string, unknown>[]) || [];
      const v0 = variants[0] || {};
      const price = num(v0.price);
      const compare = num(v0.compare_at_price);
      const totalStock = variants.reduce((s, v) => s + Math.round(num(v.inventory_quantity)), 0);
      out.push({
        externalId: String(p.id ?? p.handle ?? ""),
        title: String(p.title ?? "").trim(),
        description: clean(p.body_html),
        price,
        originalPrice: compare > 0 && compare > price ? compare : null,
        stock: totalStock,
        sku: (v0.sku as string) || null,
        condition: "new",
        freeShipping: false,
        isActive: p.status === "active",
        category: (p.product_type as string) || null,
        images: Array.isArray(p.images)
          ? (p.images as { src?: string }[]).map((im) => String(im.src ?? "")).filter((u) => /^https?:/i.test(u))
          : [],
      });
    }
    // Paginación por Link header (cursor)
    const link = res.headers.get("link") || "";
    const next = link.split(",").find((s) => s.includes('rel="next"'));
    const m = next?.match(/<([^>]+)>/);
    url = m ? m[1] : null;
  }
  return out;
}

/* ----------------------------- Tienda Nube ----------------------------- */

async function fetchTiendaNube(creds: StoreCredentials): Promise<NormalizedRow[]> {
  if (!creds.storeId || !creds.accessToken) {
    throw new Error("Falta storeId o accessToken de Tienda Nube");
  }
  const out: NormalizedRow[] = [];
  for (let page = 1; page <= 50; page++) {
    const url = `https://api.tiendanube.com/v1/${creds.storeId}/products?per_page=200&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authentication: `bearer ${creds.accessToken}`,
        "User-Agent": "Madsjeez Marketplace (soporte@madsjeez.com)",
      },
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`Tienda Nube respondió ${res.status}.`);
      break;
    }
    const items = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(items) || items.length === 0) break;
    for (const p of items) {
      const nameObj = p.name as Record<string, string> | string;
      const title =
        typeof nameObj === "string" ? nameObj : Object.values(nameObj || {})[0] || "";
      const descObj = p.description as Record<string, string> | string;
      const desc =
        typeof descObj === "string" ? descObj : Object.values(descObj || {})[0] || "";
      const variants = (p.variants as Record<string, unknown>[]) || [];
      const v0 = variants[0] || {};
      const price = num(v0.price);
      const promo = num(v0.promotional_price);
      const realPrice = promo > 0 && promo < price ? promo : price;
      const totalStock = variants.reduce((s, v) => s + Math.round(num(v.stock)), 0);
      const cats = p.categories as { name?: Record<string, string> | string }[] | undefined;
      const catName = cats && cats[0]
        ? (typeof cats[0].name === "string" ? cats[0].name : Object.values(cats[0].name || {})[0])
        : null;
      out.push({
        externalId: String(p.id ?? ""),
        title: String(title).trim(),
        description: clean(desc),
        price: realPrice,
        originalPrice: promo > 0 && promo < price ? price : null,
        stock: totalStock,
        sku: (v0.sku as string) || null,
        condition: "new",
        freeShipping: false,
        isActive: p.published !== false,
        category: catName || null,
        images: Array.isArray(p.images)
          ? (p.images as { src?: string }[]).map((im) => String(im.src ?? "")).filter((u) => /^https?:/i.test(u))
          : [],
      });
    }
    if (items.length < 200) break;
  }
  return out;
}

/* ------------------------------ Registry ------------------------------ */

export async function fetchProductsFromStore(
  platform: ConnectorPlatform,
  creds: StoreCredentials,
): Promise<NormalizedRow[]> {
  switch (platform) {
    case "woocommerce":
      return fetchWoo(creds);
    case "shopify":
      return fetchShopify(creds);
    case "tiendanube":
      return fetchTiendaNube(creds);
    default:
      throw new Error("Plataforma no soportada para conexión directa");
  }
}
