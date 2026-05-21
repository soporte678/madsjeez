import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://www.madsjeez.com.ar";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/coupons`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/subscriptions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/legal/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    const [{ data: products }, { data: categories }, { data: sellers }] = await Promise.all([
      supabase
        .from("products")
        .select("id, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("categories")
        .select("slug, updated_at")
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("id, updated_at")
        .eq("is_seller", true)
        .limit(2000),
    ]);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
      url: `${BASE_URL}/category/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const sellerRoutes: MetadataRoute.Sitemap = (sellers ?? []).map((s) => ({
      url: `${BASE_URL}/seller/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...sellerRoutes];
  } catch {
    return staticRoutes;
  }
}
