# Auditoría SEO completa — MadsJeez Marketplace (Mayo 2026)

**Dominio:** https://www.madsjeez.com.ar  
**Stack:** Next.js 16 (App Router), Prisma, Supabase, Railway  
**Mercado:** Argentina (es-AR)

---

## Resumen general SEO

El marketplace tiene una **base técnica sólida**: `metadataBase`, canonical host (apex → www), `robots.ts`, sitemap dinámico, JSON-LD global (Organization, WebSite, SearchAction), fichas de producto con Product schema, categorías con contenido editorial y BreadcrumbList, landings `/marketplace`, `/comprar`, `/tienda`, feed Google Shopping, imágenes AVIF/WebP y caché estática.

**Debilidades principales antes de esta auditoría:**

- `/search` 100 % client-side sin `noindex` → riesgo de thin/duplicate content.
- Sitemap limitado a **8.000 productos** (resto no descubrible solo por sitemap).
- URLs legacy `/seller/[id]` indexables pese al redirect a `/tienda/[slug]`.
- Títulos duplicados por `title.template` + sufijo manual en metadata.
- Páginas de checkout/carrito sin bloqueo explícito de indexación.
- Sin hreflang (aceptable si solo Argentina).

**Correcciones aplicadas en código (rama `main`):** ver sección final.

---

## Problemas críticos SEO

### SEO-001
- **ID:** SEO-001
- **Severidad:** Crítica
- **URL o módulo:** `/search`
- **Problema:** Página de búsqueda es `"use client"` sin metadata ni `noindex`; URLs con `?q=`, `?category=` generan contenido fino y duplicable.
- **Impacto SEO:** Crawl budget desperdiciado, riesgo de soft 404 / páginas filtradas indexadas sin valor.
- **Causa probable:** Implementación SPA de resultados sin capa server de SEO.
- **Solución recomendada:** `layout.tsx` con `robots: noindex, follow` + canonical `/search`. **Aplicado.**
- **Prioridad:** P0
- **Riesgo si no se corrige:** Miles de URLs basura en índice.

### SEO-002
- **ID:** SEO-002
- **Severidad:** Crítica
- **URL o módulo:** `build-sitemap-entries.ts` — `SITEMAP_PRODUCT_LIMIT = 8000`
- **Problema:** Productos activos >8k no entran al sitemap.
- **Impacto SEO:** Indexación incompleta a escala masiva.
- **Causa probable:** Límite anti-timeout en runtime.
- **Solución recomendada:** Sitemap índice con `generateSitemaps()` por chunks de 5k–10k URLs; priorizar productos con ventas/stock reciente.
- **Prioridad:** P0 (cuando catálogo >8k)
- **Riesgo si no se corrige:** Catálogo largo invisible para Google.

### SEO-003
- **ID:** SEO-003
- **Severidad:** Crítica (histórico, resuelto en deploy)
- **URL o módulo:** Build Railway + `/feeds/google-shopping.xml`
- **Problema:** Prerender en build sin DB.
- **Solución:** `force-dynamic`, guards `NEXT_PHASE`, try/catch. **Resuelto.**

---

## Problemas importantes

### SEO-004
- **ID:** SEO-004
- **Severidad:** Alta
- **URL o módulo:** `/seller/[id]`
- **Problema:** Duplicidad con `/tienda/[slug]` (redirect 307/308 pero metadata indexable).
- **Impacto SEO:** Contenido duplicado vendedor.
- **Solución:** `robots: noindex` en `/seller/*`. **Aplicado.** Ideal: redirect **301** permanente.
- **Prioridad:** P1

### SEO-005
- **ID:** SEO-005
- **Severidad:** Alta
- **URL o módulo:** `/product/[id]` metadata
- **Problema:** Título `Producto | MadsJeez | MadsJeez Marketplace` por template + sufijo manual.
- **Impacto SEO:** CTR menor, títulos truncados en SERP.
- **Solución:** `title: product.title` solo. **Aplicado.**

### SEO-006
- **ID:** SEO-006
- **Severidad:** Alta
- **URL o módulo:** `/checkout`, `/cart`, `/orders`, `/dashboard`
- **Problema:** No estaban en `robots.txt` disallow ni noindex HTML.
- **Impacto SEO:** Páginas transaccionales en índice.
- **Solución:** Ampliar `robots.ts` + layouts noindex checkout/cart. **Aplicado.**

### SEO-007
- **ID:** SEO-007
- **Severidad:** Alta
- **URL o módulo:** Home (`HomePageClient.tsx`)
- **Problema:** Home renderizada en cliente; contenido principal depende de JS/hydration.
- **Impacto SEO:** Crawlers ven menos HTML inicial; TTFB/LCP sensibles a bundles.
- **Solución:** Mover bloques estáticos (H1, texto categorías, links) a Server Components; mantener carruseles lazy.
- **Prioridad:** P1

### SEO-008
- **ID:** SEO-008
- **Severidad:** Alta
- **URL o módulo:** Landings programmatic `/comprar/*`, `/marketplace/*`
- **Problema:** Muchas páginas con plantilla similar (riesgo doorway si contenido pobre).
- **Impacto SEO:** Filtro de calidad Google en landings masivas.
- **Solución:** Mantener umbral ≥3 productos; añadir bloques únicos por ciudad (FAQ, envíos Flash, top productos).
- **Prioridad:** P1

### SEO-009
- **ID:** SEO-009
- **Severidad:** Media-Alta
- **URL o módulo:** Product schema
- **Problema:** Sin `BreadcrumbList` en ficha; `aggregateRating` solo si hay reviews (correcto); falta `priceValidUntil`.
- **Solución:** `BreadcrumbJsonLd` + `priceValidUntil`. **Aplicado.**

---

## Problemas menores

### SEO-010
- **Severidad:** Menor
- **Módulo:** `legal/aviso-legal` ausente en sitemap
- **Solución:** Añadido a sitemap estático. **Aplicado.**

### SEO-011
- **Severidad:** Menor
- **Módulo:** Open Graph product `type: website` en lugar de enriquecimiento product
- **Nota:** Next Metadata no soporta `og:type=product` nativo igual que Facebook; Product JSON-LD compensa.

### SEO-012
- **Severidad:** Menor
- **Módulo:** Logs Supabase `getSession` insecure
- **Impacto:** Seguridad admin, no ranking directo.
- **Solución:** Migrar a `getUser()` (parcialmente hecho).

### SEO-013
- **Severidad:** Menor
- **Módulo:** `keywords` meta en categorías
- **Nota:** Google ignora keywords meta; no perjudica, bajo valor.

---

## Technical SEO

| Elemento | Estado | Notas |
|----------|--------|-------|
| robots.txt | ✅ | Generado; disallow ampliado |
| sitemap.xml | ✅ | Dinámico; límite 8k productos |
| Canonical | ✅ | `metadataBase` + `canonicalMeta()` |
| Redirect apex→www | ✅ | 308 en middleware + next.config |
| SSR/SSG | ⚠️ | Producto/categoría SSR; home/search client-heavy |
| hreflang | N/A | Solo AR |
| Status 404 | ✅ | `notFound()` en rutas clave |
| Paginación | ⚠️ | Catálogo/search sin rel next/prev |
| Crawl budget | ⚠️ | Muchas landings + search |

---

## Ecommerce SEO

| Elemento | Estado |
|----------|--------|
| Ficha producto H1 | ✅ |
| Meta title/description | ✅ (corregido template) |
| Product JSON-LD | ✅ |
| Review schema | ⚠️ Solo si hay reviews reales |
| Categorías SEO | ✅ Fuerte (`buildCategorySeo`) |
| Tiendas `/tienda/[slug]` | ✅ Store schema |
| Google Shopping feed | ✅ `/feeds/google-shopping.xml` |
| GTIN/MPN | ⚠️ Solo si hay SKU |
| Filtros indexables | ❌ Search noindex (correcto) |

---

## Core Web Vitals (estimado desde código)

| Métrica | Riesgo | Mitigaciones existentes |
|---------|--------|-------------------------|
| LCP | Medio | `next/image`, lazy carruseles, WebP team |
| CLS | Medio | Revisar skeletons en home/search |
| INP | Medio | Mucho client JS en home/search |
| TTFB | Medio | `force-dynamic` en muchas rutas → menos cache CDN HTML |
| FCP | Medio | Fuentes `display: swap` ✅ |

**Recomendación:** Medir post-deploy con PageSpeed Insights móvil 4G y Search Console Core Web Vitals.

---

## Mobile SEO

- Viewport y responsive: ✅ (Tailwind)
- Touch targets: revisar filtros search en móvil
- Misma URL móvil/desktop: ✅
- Velocidad móvil: priorizar reducir JS en `/` y `/search`

---

## Schema Markup

| Schema | Ubicación | Estado |
|--------|-----------|--------|
| Organization | SiteJsonLd | ✅ |
| WebSite + SearchAction | SiteJsonLd | ✅ |
| LocalBusiness | SiteJsonLd | ✅ |
| Product + Offer | ProductJsonLd | ✅ Mejorado |
| BreadcrumbList | Categoría, Producto | ✅ Producto añadido |
| Store | /tienda/[slug] | ✅ |
| FAQ | Algunas landings | Parcial |

**Falta:** `ItemList` en categorías con lista de productos; `Review` por review individual (opcional).

---

## Arquitectura SEO

```
/ (home)
├── /category/[slug]     ← hub principal
├── /product/[id]        ← money pages
├── /tienda/[slug]       ← seller hub
├── /search              ← noindex
├── /marketplace/...     ← SEO local
├── /comprar/...         ← programmatic
├── /catalog, /products  ← posible solapamiento
└── /legal/*             ← trust
```

**Profundidad:** 2–3 clics desde home a producto ✅  
**Linking interno:** Mejorar enlaces tienda desde ficha (`/tienda/` vs `/seller/`).

---

## Performance

- Standalone Docker, caché `/_next/static` 1 año ✅
- `optimizePackageImports` lucide ✅
- GTM + Meta Pixel diferidos (`DeferredAnalytics`) ✅
- TrafficTracker: impacto bajo con idle callback ✅

---

## Acciones prioritarias

1. **P0** — Desplegar fixes noindex/search, robots, breadcrumbs, títulos.
2. **P0** — Ejecutar backfill `store_slug` si no se hizo.
3. **P1** — Sitemap multi-archivo cuando productos >8k.
4. **P1** — Registrar feed en Google Merchant Center.
5. **P1** — PageSpeed móvil + corregir LCP/INP regresiones.
6. **P2** — Enriquecer landings `/comprar` con contenido único + FAQ schema.
7. **P2** — `ItemList` JSON-LD en categorías.
8. **P2** — 301 permanente `/seller/[id]` → `/tienda/[slug]`.

---

## Checklist SEO final (orden de prioridad)

- [x] robots.txt: bloquear admin, api, dashboard, checkout, cart, auth
- [x] noindex: /search, /checkout, /cart
- [x] noindex: /seller/[id]
- [x] Canonical relativo consistente en categorías
- [x] Títulos producto sin duplicar template
- [x] BreadcrumbList JSON-LD en producto
- [x] priceValidUntil en Offer schema
- [x] sitemap: aviso-legal
- [ ] Sitemap índice para >8k productos
- [ ] Backfill tiendas en producción
- [ ] Merchant Center feed
- [ ] Medición CWV real (PSI + GSC)
- [ ] Contenido único landings programmatic
- [ ] Redirect 301 seller → tienda
- [ ] ItemList schema categorías
- [ ] Server-render bloques críticos home

---

## Cambios de código en esta auditoría

- `src/app/search/layout.tsx` — noindex
- `src/app/checkout/layout.tsx`, `src/app/cart/layout.tsx` — noindex
- `src/app/robots.ts` — disallow ampliado
- `src/app/product/[id]/page.tsx` — título, Twitter, BreadcrumbJsonLd
- `src/app/category/[slug]/page.tsx` — canonical relativo
- `src/app/seller/[id]/page.tsx` — noindex
- `src/components/seo/BreadcrumbJsonLd.tsx` — nuevo
- `src/lib/seo/robots-meta.ts` — utilidades
- `src/components/seo/ProductJsonLd.tsx` — category, priceValidUntil
- `src/lib/seo/build-sitemap-entries.ts` — aviso-legal

---

*Auditoría generada como Senior SEO / Technical SEO para MadsJeez. Re-medir en Search Console 2–4 semanas post-deploy.*
