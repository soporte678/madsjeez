import { getAllPosts } from "@/lib/blog/store";
import { BLOG_POSTS } from "@/data/blog-posts";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.madsjeez.com.ar";
const SITE_NAME = "Madsjeez";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const dynamic = getAllPosts();
  const now = new Date().toUTCString();

  const dynamicItems = dynamic
    .map(
      (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt}]]></description>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <author><![CDATA[${esc(p.author)}]]></author>
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
    </item>`
    )
    .join("");

  const staticItems = BLOG_POSTS.map(
    (p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <description><![CDATA[${p.excerpt}]]></description>
      <pubDate>${new Date(p.updatedAt).toUTCString()}</pubDate>
      ${p.tags.map((t) => `<category>${esc(t)}</category>`).join("")}
    </item>`
  ).join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_NAME} — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Guías, noticias y recursos para compradores y vendedores de maquinaria, herramientas y repuestos en Argentina.</description>
    <language>es-ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/favicon.ico</url>
      <title>${SITE_NAME}</title>
      <link>${SITE_URL}</link>
    </image>
${dynamicItems}${staticItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
