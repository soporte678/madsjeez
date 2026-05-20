import { buildGoogleShoppingFeedXml } from "@/lib/seo/google-shopping-feed";

export const revalidate = 3600;

export async function GET() {
  const xml = await buildGoogleShoppingFeedXml();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
    },
  });
}
