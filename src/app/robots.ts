import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/auth/"],
      },
    ],
    sitemap: "https://www.madsjeez.com.ar/sitemap.xml",
    host: "https://www.madsjeez.com.ar",
  };
}
