/**
 * GET /api/feed/google-merchant.xml
 *
 * Feed de productos para Google Merchant Center (Google Shopping), formato
 * RSS 2.0 con namespace g:. Solo productos REALES activos con stock, precio e
 * imagen válida. No inventa brand/gtin/mpn: si no existen, marca
 * identifier_exists=no (comportamiento correcto de Google).
 *
 * Consistencia: precio/stock salen de la misma DB que la página y el JSON-LD.
 * Submit en Merchant Center: ver docs/MERCHANT_CENTER_SETUP.md.
 */

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

const SITE = "https://www.madsjeez.com.ar";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function conditionFor(c: string | null): string {
  if (c === "used") return "used";
  if (c === "refurbished") return "refurbished";
  return "new";
}

export async function GET() {
  // Productos activos con stock + categoría + imágenes (en lotes razonables).
  const { data: products, error } = await supabaseService
    .from("products")
    .select(
      'id, title, description, price, original_price, compare_price, stock, condition, sku, free_shipping, shipping_cost, category_id, product_images(url, "order"), categories:category_id(name)',
    )
    .eq("is_active", true)
    .gt("stock", 0)
    .limit(10000);

  if (error) {
    console.error("merchant-feed:", error);
    return new NextResponse("<?xml version=\"1.0\"?><error/>", {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  const items: string[] = [];
  for (const p of products ?? []) {
    const imgs = ((p.product_images as { url: string; order: number }[]) || [])
      .filter((im) => /^https?:\/\//i.test(im.url))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const price = Number(p.price);
    // Validación: sin imagen o sin precio → se omite (ver diagnostics).
    if (imgs.length === 0 || !(price > 0)) continue;

    const listPrice = Number(p.compare_price ?? p.original_price ?? 0);
    const onSale = listPrice > price;
    const catName = (p.categories as { name?: string } | null)?.name || "Productos";
    const link = `${SITE}/product/${p.id}`;
    const shipping = p.free_shipping
      ? `<g:shipping><g:country>AR</g:country><g:price>0.00 ARS</g:price></g:shipping>`
      : Number(p.shipping_cost) > 0
        ? `<g:shipping><g:country>AR</g:country><g:price>${Number(p.shipping_cost).toFixed(2)} ARS</g:price></g:shipping>`
        : "";

    const additional = imgs
      .slice(1, 11)
      .map((im) => `<g:additional_image_link>${esc(im.url)}</g:additional_image_link>`)
      .join("");

    items.push(
      `<item>` +
        `<g:id>${esc(p.id)}</g:id>` +
        `<title>${esc(String(p.title).slice(0, 150))}</title>` +
        `<description>${esc(String(p.description || p.title).replace(/<[^>]+>/g, " ").slice(0, 5000))}</description>` +
        `<link>${esc(link)}</link>` +
        `<g:image_link>${esc(imgs[0].url)}</g:image_link>` +
        additional +
        `<g:availability>in_stock</g:availability>` +
        `<g:condition>${conditionFor(p.condition)}</g:condition>` +
        (onSale
          ? `<g:price>${listPrice.toFixed(2)} ARS</g:price><g:sale_price>${price.toFixed(2)} ARS</g:sale_price>`
          : `<g:price>${price.toFixed(2)} ARS</g:price>`) +
        (p.sku ? `<g:mpn>${esc(p.sku)}</g:mpn>` : "") +
        // Sin brand/gtin reales → declaramos que no existen identificadores.
        (p.sku ? "" : `<g:identifier_exists>no</g:identifier_exists>`) +
        `<g:product_type>${esc(catName)}</g:product_type>` +
        shipping +
      `</item>`,
    );
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">` +
    `<channel>` +
    `<title>Madsjeez Marketplace</title>` +
    `<link>${SITE}</link>` +
    `<description>Catálogo de productos activos de Madsjeez Argentina</description>` +
    items.join("") +
    `</channel></rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    },
  });
}
