import type { MetadataRoute } from "next";
import { supabaseService } from "@/lib/supabase/service";
import { GUIAS_COMPRA } from "@/data/guias-compra";

const BASE_URL = "https://www.madsjeez.com.ar";

/* ------------------------------------------------------------------ */
/*  Sitemap optimizado para SEO — incluye productos, categorías,      */
/*  tiendas y rutas estáticas prioritarias.                           */
/* ------------------------------------------------------------------ */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  /* -- URLs estáticas (alta prioridad) ----------------------------- */
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                  lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/marketplace`,                 lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/categories`,                  lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/vender`,                      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/sell`,                        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/seller/register`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/subscriptions`,               lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/blog`,                        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/coupons`,                     lastModified: new Date(), changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE_URL}/quienes-somos`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/help`,                        lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/tutoriales`,                  lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...['postularte-fundador','crear-cuenta','publicar-producto','configurar-pagos','gestionar-preguntas','generar-etiquetas','ver-metricas','usar-ads'].map((s) => ({
      url: `${BASE_URL}/tutoriales/${s}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    // Guías de compra (contenido editorial real, ancladas a categorías con inventario)
    { url: `${BASE_URL}/guias`,                       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...GUIAS_COMPRA.map((g) => ({
      url: `${BASE_URL}/guias/${g.slug}`,
      lastModified: new Date(g.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: `${BASE_URL}/legal/terminos`,              lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/privacidad`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/cookies`,               lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/reembolsos`,            lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/legal/aviso-legal`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  try {
    // Service role: el sitemap es server-only y necesita leer users (store_slug),
    // que con el cliente anónimo queda bloqueado por RLS (por eso salían 0 tiendas).
    const supabase = supabaseService;

    /* -- Productos activos + categorías + sellers ------------------- */
    const [{ data: products }, { data: categories }, { data: stockRows }, { data: sellers }, { data: stores }] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, updated_at")
          .eq("is_active", true)
          .order("updated_at", { ascending: false })
          .limit(5000),
        // categories: la tabla NO tiene is_active ni updated_at (solo created_at).
        supabase
          .from("categories")
          .select("id, slug, created_at"),
        // Para gating de indexación: contamos productos en stock por categoría.
        supabase
          .from("products")
          .select("category_id")
          .eq("is_active", true)
          .gt("stock", 0)
          .limit(10000),
        // Sellers/stores viven en `users` (Prisma), no en `profiles`.
        supabase
          .from("users")
          .select("id, updated_at")
          .eq("isSeller", true)
          .limit(2000),
        supabase
          .from("users")
          .select("store_slug, updated_at")
          .eq("isSeller", true)
          .not("store_slug", "is", null)
          .limit(2000),
      ]);

    const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // Tally de productos en stock por categoría → solo indexamos las que
    // tienen ≥5 (mismo umbral que el gate de la página de categoría).
    const MIN_INDEX = 5;
    const countByCat = new Map<string, number>();
    for (const r of stockRows ?? []) {
      const cid = (r as { category_id: string | null }).category_id;
      if (cid) countByCat.set(cid, (countByCat.get(cid) ?? 0) + 1);
    }

    const categoryRoutes: MetadataRoute.Sitemap = (categories ?? [])
      .filter((c) => (countByCat.get((c as { id: string }).id) ?? 0) >= MIN_INDEX)
      .map((c) => ({
        url: `${BASE_URL}/category/${c.slug}`,
        lastModified: (c as { created_at?: string }).created_at
          ? new Date((c as { created_at: string }).created_at)
          : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));

    const sellerRoutes: MetadataRoute.Sitemap = (sellers ?? []).map((s) => ({
      url: `${BASE_URL}/seller/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const storeRoutes: MetadataRoute.Sitemap = (stores ?? [])
      .filter((s): s is { store_slug: string; updated_at: string | null } => Boolean(s.store_slug))
      .map((s) => ({
        url: `${BASE_URL}/tienda/${s.store_slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...sellerRoutes, ...storeRoutes];
  } catch {
    /* -- Fallback: solo rutas estáticas si la DB falla -------------- */
    return staticRoutes;
  }
}
