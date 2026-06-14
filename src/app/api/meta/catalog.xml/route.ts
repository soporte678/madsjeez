import { NextResponse } from "next/server";
import { generateMetaCatalogFeed } from "@/lib/meta/catalog-feed";
import { logger } from "@/lib/logger";

/**
 * GET /api/meta/catalog.xml
 *
 * Public XML feed of active in-stock products for Meta Commerce Catalog.
 * Format follows Google Merchant XML (Meta accepts it via the same parser).
 *
 * Caching: 1 hour at the CDN, 5 minutes in the browser, stale-while-revalidate 24h.
 * Meta's ingestion scheduler typically pulls every 4-24h, so 1h freshness is plenty.
 *
 * Returns only active products with stock and at least one image. Reads via Prisma
 * (which enforces app-level row scoping); no service-role Supabase key needed here.
 *
 * force-dynamic: evita el prerender en build (sin DATABASE_URL en Docker build),
 * que tiraba "[ERROR] meta/catalog.xml generation failed". La frescura la maneja
 * el header Cache-Control (CDN 1h), no el ISR.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const xml = await generateMetaCatalogFeed();
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    logger.error("meta/catalog.xml generation failed:", e);
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>MadsJeez Marketplace</title><description>Temporarily unavailable</description></channel></rss>`;
    return new NextResponse(fallback, {
      status: 500,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
