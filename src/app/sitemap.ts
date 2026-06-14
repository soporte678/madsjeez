import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { GUIAS_COMPRA } from "@/data/guias-compra";
import { SELLER_LANDINGS } from "@/data/seller-landings";
import { BLOG_POSTS } from "@/data/blog-posts";
import { HELP_ARTICLES } from "@/data/help-articles";

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
    { url: `${BASE_URL}/sell`,                        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/crear-tienda-online`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE_URL}/comprar-en-madsjeez`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.85 },
    { url: `${BASE_URL}/maqjeez-y-madsjeez`,          lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    // Landings de captación de vendedores (hub canónico: /vender-en-madsjeez).
    // /vender ya no se lista: su canonical apunta al hub para consolidar señal.
    ...SELLER_LANDINGS.map((l) => ({
      url: `${BASE_URL}/${l.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: l.priority ?? 0.85,
    })),
    { url: `${BASE_URL}/seller/register`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/subscriptions`,               lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE_URL}/blog`,                        lastModified: new Date(), changeFrequency: "weekly",  priority: 0.7 },
    ...BLOG_POSTS.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    { url: `${BASE_URL}/coupons`,                     lastModified: new Date(), changeFrequency: "daily",   priority: 0.6 },
    { url: `${BASE_URL}/quienes-somos`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/ayuda`,                       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    ...HELP_ARTICLES.map((a) => ({
      url: `${BASE_URL}/ayuda/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.55,
    })),
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
    // Cliente anónimo para datos públicos (products/categories tienen RLS de
    // lectura pública y funcionan acá).
    const supabase = await createClient();

    /* -- Productos activos + categorías ------------------------------ */
    const [{ data: products }, { data: categories }, { data: stockRows }] = await Promise.all([
      supabase
        .from("products")
        .select("id, updated_at")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5000),
      // categories: la tabla NO tiene is_active ni updated_at (solo created_at).
      supabase.from("categories").select("id, slug, created_at"),
      // Para gating de indexación: contamos productos en stock por categoría.
      supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true)
        .gt("stock", 0)
        .limit(10000),
    ]);

    /* -- Sellers/stores viven en `users` (Prisma). Bloqueados por RLS al
          cliente anónimo, así que usamos service role en un try aislado para
          que su falla no tumbe productos/categorías. ------------------ */
    type SellerRow = { id: string; updated_at: string | null };
    type StoreRow = { store_slug: string | null; updated_at: string | null };
    let sellers: SellerRow[] = [];
    let stores: StoreRow[] = [];
    try {
      const [{ data: s1 }, { data: s2 }] = await Promise.all([
        supabaseService.from("users").select("id, updated_at").eq("isSeller", true).limit(2000),
        supabaseService
          .from("users")
          .select("store_slug, updated_at")
          .eq("isSeller", true)
          .not("store_slug", "is", null)
          .limit(2000),
      ]);
      sellers = (s1 as SellerRow[] | null) ?? [];
      stores = (s2 as StoreRow[] | null) ?? [];
    } catch {
      /* sin sellers/stores en el sitemap si falla service role */
    }

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

    const sellerRoutes: MetadataRoute.Sitemap = sellers.map((s) => ({
      url: `${BASE_URL}/seller/${s.id}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const storeRoutes: MetadataRoute.Sitemap = stores
      .filter((s) => Boolean(s.store_slug))
      .map((s) => ({
        url: `${BASE_URL}/tienda/${s.store_slug}`,
        lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    /* -- PartsVision: solo si el flag SEO está activo y hay contenido publicado -- */
    let pvRoutes: MetadataRoute.Sitemap = [];
    try {
      const { data: flag } = await supabaseService
        .from("feature_flags").select("enabled").eq("key", "partsvision_seo_enabled").maybeSingle();
      if (flag?.enabled) {
        const [{ data: pvTypes }, { data: pvModels }, { data: pvDiagrams }] = await Promise.all([
          supabaseService.from("pv_machine_types").select("slug").eq("active", true),
          supabaseService.from("pv_machine_models").select("slug, brand:brand_id(slug)").neq("status", "draft").limit(2000),
          supabaseService.from("pv_diagrams").select("id").eq("publication_status", "published").limit(2000),
        ]);
        pvRoutes = [
          { url: `${BASE_URL}/repuestos`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
          ...(pvTypes ?? []).map((t) => ({ url: `${BASE_URL}/maquinas/${t.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 })),
          ...(pvModels ?? [])
            .map((m) => m as unknown as { slug: string; brand: { slug: string } | null })
            .filter((m) => m.brand?.slug)
            .map((m) => ({ url: `${BASE_URL}/modelos/${m.brand!.slug}/${m.slug}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 })),
          ...(pvDiagrams ?? []).map((d) => ({ url: `${BASE_URL}/despieces/${d.id}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 })),
        ];
      }

      // Diagnóstico por síntomas (flag propio)
      const { data: diagFlag } = await supabaseService
        .from("feature_flags").select("enabled").eq("key", "partsvision_diagnostics_enabled").maybeSingle();
      if (diagFlag?.enabled) {
        const { data: symptoms } = await supabaseService
          .from("pv_symptoms").select("slug, type:machine_type_id(slug)").eq("status", "published").limit(2000);
        const typeSlugs = new Set<string>();
        const symRoutes: MetadataRoute.Sitemap = [];
        for (const sRow of symptoms ?? []) {
          const tt = (sRow as { type: { slug: string } | { slug: string }[] }).type;
          const ts = (Array.isArray(tt) ? tt[0] : tt)?.slug;
          if (!ts) continue;
          typeSlugs.add(ts);
          symRoutes.push({ url: `${BASE_URL}/diagnostico/${ts}/${sRow.slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 });
        }
        pvRoutes.push(
          { url: `${BASE_URL}/diagnostico`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
          ...Array.from(typeSlugs).map((ts) => ({ url: `${BASE_URL}/diagnostico/${ts}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 })),
          ...symRoutes,
        );
      }
    } catch {
      /* sin PartsVision en el sitemap si falla */
    }

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...sellerRoutes, ...storeRoutes, ...pvRoutes];
  } catch {
    /* -- Fallback: solo rutas estáticas si la DB falla -------------- */
    return staticRoutes;
  }
}
