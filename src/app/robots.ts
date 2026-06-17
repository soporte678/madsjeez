import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/cart",
          "/checkout",
          "/account/",
          "/api/",
          "/dashboard/",
          "/search",
          "/offers",
          "/deals",
        ],
      },
    ],
    sitemap: "https://www.madsjeez.com.ar/sitemap.xml",
  };
}
