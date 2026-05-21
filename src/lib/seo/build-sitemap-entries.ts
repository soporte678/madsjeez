import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { sellerSegments } from "@/lib/seller-acquisition";
import { HELP_SLUGS } from "@/lib/help-articles";
import { allMarketplaceLocationPaths } from "@/lib/seo/argentina-locations";
import { getAllComprarLandingParams } from "@/lib/seo/comprar-landings";
import { listIndexableStoreSlugs } from "@/lib/public-store";
import { SITE_URL, SITEMAP_PRODUCT_LIMIT } from "@/lib/seo/site";

const STATIC_PATHS: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/categories", priority: 0.95, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
  { path: "/products", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.85, changeFrequency: "weekly" },
  { path: "/offers", priority: 0.85, changeFrequency: "daily" },
  { path: "/deals", priority: 0.85, changeFrequency: "daily" },
  { path: "/sell", priority: 0.9, changeFrequency: "weekly" },
  { path: "/seller/register", priority: 0.9, changeFrequency: "weekly" },
  { path: "/vender", priority: 0.95, changeFrequency: "weekly" },
  { path: "/quienes-somos", priority: 0.75, changeFrequency: "monthly" },
  { path: "/marketplace", priority: 0.9, changeFrequency: "weekly" },
  { path: "/comprar", priority: 0.88, changeFrequency: "weekly" },
  { path: "/help", priority: 0.6, changeFrequency: "monthly" },
  { path: "/legal/terminos", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacidad", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/cookies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/reembolsos", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/aviso-legal", priority: 0.3, changeFrequency: "yearly" },
];

function entry(
  path: string,
  lastModified: Date,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  };
}

/**
 * URLs indexables para Google: estáticas + categorías + productos activos + landings /vender.
 */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) =>
    entry(path, now, priority, changeFrequency)
  );

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return out;
  }

  for (const segment of sellerSegments) {
    out.push(entry(`/vender/${segment.slug}`, now, 0.88, "weekly"));
  }

  for (const slug of HELP_SLUGS) {
    out.push(entry(`/help/${slug}`, now, 0.55, "monthly"));
  }

  for (const loc of allMarketplaceLocationPaths()) {
    const path = loc.localidad
      ? `/marketplace/${loc.provincia}/${loc.localidad}`
      : `/marketplace/${loc.provincia}`;
    out.push(entry(path, now, loc.localidad ? 0.78 : 0.85, "weekly"));
  }

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, createdAt: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: SITEMAP_PRODUCT_LIMIT,
      }),
    ]);

    for (const cat of categories) {
      out.push(entry(`/category/${cat.slug}`, cat.createdAt, 0.82, "weekly"));
    }

    for (const product of products) {
      out.push(entry(`/product/${product.id}`, product.updatedAt, 0.75, "weekly"));
    }

    try {
      const stores = await listIndexableStoreSlugs();
      for (const store of stores) {
        out.push(entry(`/tienda/${store.slug}`, store.updatedAt, 0.8, "weekly"));
      }
    } catch (err) {
      console.warn("[sitemap] tiendas omitidas:", err);
    }

    try {
      const comprarParams = await getAllComprarLandingParams();
      for (const c of comprarParams) {
        out.push(
          entry(`/comprar/${c.categoria}/en/${c.ciudad}`, now, 0.76, "weekly")
        );
      }
    } catch (err) {
      console.warn("[sitemap] comprar omitido:", err);
    }
  } catch (err) {
    console.warn("[sitemap] No se pudieron cargar categorías/productos desde DB:", err);
  }

  return out;
}
