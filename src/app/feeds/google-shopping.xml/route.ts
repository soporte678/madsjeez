import { buildGoogleShoppingFeedXml } from "@/lib/seo/google-shopping-feed";

/** Sin DB durante Docker build en Railway (evita prerender en `next build`). */
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const xml = await buildGoogleShoppingFeedXml();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
