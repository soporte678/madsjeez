import type { MetadataRoute } from "next";

const BASE = "https://www.madsjeez.com.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/categories",
    "/catalog",
    "/products",
    "/search",
    "/offers",
    "/deals",
    "/sell",
    "/seller/register",
    "/help",
    "/legal/terminos",
    "/legal/privacidad",
    "/legal/cookies",
    "/legal/reembolsos",
  ];

  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/sell" || path === "/seller/register" ? 0.9 : 0.7,
  }));
}
