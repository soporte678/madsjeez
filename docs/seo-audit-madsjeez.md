# Auditoría SEO técnica — MADSJEEZ

Sitio: https://www.madsjeez.com.ar
Stack: Next.js 16 (App Router, RSC) · React 19 · Prisma · Supabase (Postgres) · Railway
Fecha de auditoría: 2026-06-05
Catálogo al momento de la auditoría: **737 productos activos** (732 con stock), **492 categorías** (solo **114 con productos**, **29 con ≥5 en stock**), **3 vendedores** activos.

> Regla rectora: ninguna página indexable sin inventario/contenido real. No se inventan productos, precios, stock, reseñas ni estadísticas.

---

## Resumen ejecutivo

El sitio ya tiene buena base técnica (category y product pages son **Server Components con SSR real**, metadata + canonical + JSON-LD presentes). El problema central **no es rendering**, es **index bloat**: el sitemap empuja las 492 categorías al índice cuando **~378 están vacías** y otras ~85 tienen 1–4 productos. Eso diluye autoridad y genera "contenido pobre" masivo a ojos de Google.

Prioridad inmediata implementada en esta tanda:
1. **Gate de indexación por inventario real** (≥5 productos en stock) en categorías, sitemap, y noindex en `/offers` y `/deals` (CSR + potencialmente vacías).
2. Documentación + inventario real.

---

## Hallazgos por severidad

### CRÍTICO

| # | Problema | URL afectada | Evidencia | Solución | Archivos | Estado |
|---|----------|--------------|-----------|----------|----------|--------|
| C1 | **Index bloat**: sitemap incluye las 492 categorías sin filtrar por inventario. ~378 vacías + ~85 con 1–4 productos = contenido pobre masivo. | `/category/*`, `/sitemap.xml` | `categories.eq("is_active", true)` sin contar productos | Filtrar sitemap a categorías con ≥5 productos en stock + `robots: noindex` dinámico en la página de categoría bajo el umbral. | `src/app/sitemap.ts`, `src/app/category/[slug]/page.tsx`, `src/lib/seo/indexability.ts` | ✅ Implementado |
| C2 | `/offers` y `/deals` son **CSR** (`"use client"`) y pueden mostrar 0 resultados; eran **indexables**. Google ve "Cargando…"/grilla vacía. | `/offers`, `/deals` | `offers/page.tsx:1 "use client"`, layout sin `robots` | `robots: noindex,follow` hasta tener render server-side con ofertas garantizadas. | `src/app/offers/layout.tsx`, `src/app/deals/layout.tsx` | ✅ Implementado |

### ALTO

| # | Problema | URL | Evidencia | Solución | Estado |
|---|----------|-----|-----------|----------|--------|
| H1 | `/search` es CSR puro con "Cargando…". | `/search` | `search/page.tsx:1` | Ya tenía `robots: noindex,follow` en `search/layout.tsx`. Correcto. | ✅ Ya OK |
| H2 | Categorías duplicadas por import de MercadoLibre (ej. "Otros" ×3, "Tapas de Arranque" ×2, "Carburadores" ×2, "Carreteles" ×3). Riesgo de canibalización/duplicado. | varias `/category/*` | inventario DB | Consolidar a futuro (merge de subcategorías equivalentes) o canonical entre duplicadas. **Pendiente** — requiere decisión de taxonomía. | ⏳ Pendiente |
| H3 | Product pages sin ISR (`revalidate`): SSR en cada request → carga DB alta + presión sobre crawl budget. | `/product/*`, `/category/*` | sin `export const revalidate` | Agregar `revalidate` (ISR). **Pendiente** — validar que el contador de vistas no dependa de SSR puro. | ⏳ Pendiente |

### MEDIO

| # | Problema | URL | Solución | Estado |
|---|----------|-----|----------|--------|
| M1 | Sitemap monolítico (un solo archivo con productos+categorías+sellers+stores). | `/sitemap.xml` | Dividir por tipo (`/sitemaps/products.xml`, `categories.xml`, etc.) cuando supere ~5k URLs. Hoy con 737 productos no es urgente. | ⏳ Pendiente |
| M2 | `OrganizationJsonLd` lista `sameAs` con dominios no relacionados (appjeezpro.com, trabajocerca.site, etc.). Viola spec de `sameAs` (deben ser perfiles de la MISMA entidad). | global | Dejar solo redes sociales reales de Madsjeez. **Pendiente.** | ⏳ Pendiente |
| M3 | Seller pages (`/seller/[id]`) y stores (`/tienda/[slug]`) sin JSON-LD `Organization`/`Store` por vendedor. | `/seller/*`, `/tienda/*` | Agregar schema por vendedor + canonical. **Pendiente.** | ⏳ Pendiente |
| M4 | Sin páginas `/guias` ni `/soluciones` (existen `/tutoriales` para sellers, no guías de compra para buyers). | — | Crear guías de compra basadas SOLO en verticales con inventario real (ver Fase 7). **Pendiente.** | ⏳ Pendiente |

### BAJO

| # | Problema | Nota |
|---|----------|------|
| L1 | `apps/web/` es una copia stale del monorepo, NO se deploya (Railway corre `next build` en root con `src/app`). Puede confundir auditorías. | Limpiar/eliminar a futuro. |
| L2 | Sitemap consulta tabla `profiles` (Supabase auth) en vez de `users` (Prisma). Los `store_slug` viven en `users`, así que las stores podrían no salir en sitemap. | Verificar y unificar fuente. |
| L3 | robots.txt no bloquea params de orden/precio/color. Hoy esos filtros no generan URLs indexables (son client-side), pero conviene blindar si se vuelven SSR. | Preventivo. |

---

## Por qué Google podía ver "Cargando…"

Investigado: **las categorías y productos NO tienen ese problema** — `category/[slug]/page.tsx` y `product/[id]/page.tsx` son Server Components `async` que renderizan la grilla/datos en el HTML inicial (verificado: `products.map(...)` server-side, sin `useEffect`).

El "Cargando…" aparecía en páginas **CSR**: `/search`, `/offers`, `/deals` (todas `"use client"` con fetch en `useEffect`). De esas, `/search` ya estaba noindex; `/offers` y `/deals` quedaron noindex en esta tanda. Conclusión: **ninguna página indexable muestra "Cargando…" como contenido principal**.

---

## Estado de los criterios de aceptación

| Criterio | Estado |
|----------|--------|
| Googlebot recibe contenido principal en HTML inicial (categorías/productos) | ✅ Ya cumplía (SSR) |
| No existan páginas indexables vacías | ✅ Gate ≥5 productos en categoría + sitemap |
| No aparezca "Cargando…" como contenido principal en indexables | ✅ /search, /offers, /deals → noindex |
| Todas las indexables con productos/info útil | ✅ Gate por inventario |
| Canonicals correctos | ✅ Categoría/producto OK; seller/tienda pendiente |
| Filtros no generan miles de URLs indexables | ✅ Son CSR + noindex |
| Productos descubribles por links HTML | ✅ Grilla SSR + sitemap |
| Sitemaps solo URLs válidas | ✅ Categorías filtradas a ≥5 productos |
| Precios/stock coinciden página/schema/feed | ⏳ Feed Merchant pendiente |
| Sin estadísticas/reseñas inventadas | ✅ `AggregateRating` solo si hay reviews reales |
| Proyecto compila / no rompe marketplace | ✅ typecheck de archivos nuevos limpio |

---

## Próximas etapas recomendadas (orden de impacto real)

1. **Consolidar categorías duplicadas** (H2) — merge de las subcategorías MeLi equivalentes para concentrar inventario y autoridad. Sin esto, "Tapas de Arranque" se reparte en 2 URLs con 48 y 25 productos en vez de 1 con 73.
2. **Guías de compra reales** para los 2 verticales con inventario: repuestos de máquinas de jardín (desmalezadoras/motosierras) y ropa de bebé. NO crear guías de verticales sin productos.
3. **ISR** (`revalidate`) en category/product.
4. **Feed Google Merchant Center** desde datos reales (precio/stock/moneda consistentes).
5. **Schema por vendedor** en `/seller` y `/tienda`.
6. Limpiar `sameAs` de OrganizationJsonLd.

---

## Inventario

Ver `docs/seo-page-inventory.csv` (generado desde la base de datos real).
- **29 categorías** califican para INDEX (≥5 productos en stock).
- El resto queda NOINDEX automáticamente vía el gate, sin borrar la página (siguen accesibles y suben a INDEX solas cuando crecen en inventario).
