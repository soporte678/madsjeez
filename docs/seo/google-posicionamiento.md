# Posicionar MadsJeez en Google (marketplace)

## Expectativa realista

La búsqueda genérica **「marketplace」** en Argentina compite con dominios de autoridad enorme (Mercado Libre, Amazon, Tiendanube, etc.). **No es realista prometer página 1 solo con esa palabra** en semanas.

Lo alcanzable en 3–12 meses con trabajo constante:

| Tipo de consulta | Ejemplos | Dificultad |
|------------------|----------|------------|
| Marca | `madsjeez`, `madsjeez marketplace` | Baja (deberían rankear ya) |
| Long-tail Argentina | `marketplace argentina`, `marketplace para vender online argentina` | Media |
| Rubro + intención | `marketplace herramientas argentina`, `vender ferretería online` | Media-baja |
| Producto/categoría | `motosierra stihl precio`, `herramientas eléctricas comprar` | Media (por ficha) |
| Genérica corta | `marketplace` | Muy alta |

**Objetivo recomendado:** página 1 para **marca + long-tail + categorías/productos**, y subir posiciones para **「marketplace argentina」** y variantes.

---

## Checklist técnico (código / infra)

- [x] `robots.txt` permite indexación (`/admin`, `/api`, `/dashboard` bloqueados)
- [x] `sitemap.xml` dinámico: home, categorías, productos activos, `/vender/*`
- [x] Metadata global + JSON-LD `Organization` / `WebSite` + `SearchAction`
- [x] **Un solo H1** en home con la palabra **marketplace** (`Marketplace en Argentina — MadsJeez`)
- [x] Imagen Open Graph / Twitter (`/opengraph-image`, 1200×630)
- [ ] **Google Search Console**: propiedad `https://www.madsjeez.com.ar`, enviar sitemap
- [ ] Variable `GOOGLE_SITE_VERIFICATION` en Railway (ver `.env.example`)
- [x] Canonical `www.madsjeez.com.ar` (middleware + redirect apex → www)
- [x] `llms.txt` en `/llms.txt`
- [x] Schema `LocalBusiness` + `sameAs` (redes vía env)
- [ ] SPF + DMARC en DNS — ver `docs/seo/dns-spf-dmarc.md`
- [ ] URLs de redes en Railway — ver `docs/seo/redes-sociales.md`
- [ ] Core Web Vitals en verde (LCP en home con muchas imágenes)
- [ ] Fichas de producto: título único, descripción >150 palabras, 5+ fotos

---

## Checklist de contenido y autoridad (fuera del código)

1. **Google Search Console** — indexación, errores, consultas reales.
2. **Google Business Profile** (si hay local físico o marca registrada).
3. **Backlinks** — notas en medios, partners, ferreterías que venden en la plataforma, directorios de e-commerce AR.
4. **Blog / guías** — artículos indexables (no solo el generador IA interno): “Cómo vender en un marketplace en Argentina”, comparativas por rubro.
5. **Landings `/vender/{rubro}`** — enlazar desde redes y email a captar vendedores (generan enlaces internos + keywords).
6. **Reseñas y señales de confianza** — testimonios, casos, logos de vendedores.
7. **RRSS** — enlaces a categorías y ofertas (señales indirectas).

---

## Palabras clave a priorizar en títulos y H1

- Home / layout: **Marketplace Argentina**, MadsJeez, comprar y vender online.
- `/vender`: marketplace para vendedores, publicar productos, pagos Mercado Pago.
- `/category/*`: ya tienen SEO + FAQ schema.
- Productos: `{producto} | comprar en MadsJeez` + descripción única.

Evitar **keyword stuffing**; Google penaliza títulos repetidos en miles de fichas.

---

## Métricas a mirar (mensual)

| Métrica | Herramienta |
|---------|-------------|
| Impresiones / clics / posición media | Search Console |
| Páginas indexadas vs enviadas | Search Console → Sitemaps |
| Consultas con “marketplace” | Search Console → Rendimiento |
| Tráfico orgánico | GA4 (`G-8RENP5BJ58`) |

---

## Plan 90 días (resumen)

| Mes | Acciones |
|-----|----------|
| 1 | Search Console + sitemap enviado; arreglar errores de indexación; 10 fichas producto modelo |
| 2 | 4 artículos SEO publicados; 5 backlinks de calidad; optimizar landings categoría top |
| 3 | Campaña PR/local; ampliar catálogo indexable; revisar posición “marketplace argentina” |

---

## Core Web Vitals / PageSpeed (móvil)

Cambios aplicados para subir **Rendimiento** y **Accesibilidad**:

- GTM/GA con `lazyOnload` (`DeferredAnalytics`)
- Menos pesos de fuentes Google (`Outfit` 400–700, `Montserrat` 800)
- CSS del hero en `globals.css` (sin `<style>` bloqueante en layout)
- `dynamic()` en home: carruseles, ads, IA, bots flotantes
- `optimizePackageImports: lucide-react`
- Imagen hero con `priority` + optimización Next (sin `unoptimized`)
- Navbar: `aria-label` en botones/enlaces icono, áreas táctiles 44px, mejor contraste

Tras deploy, volver a medir en PageSpeed (móvil, 4G lenta). Objetivo razonable: **Rendimiento 80+**, **Accesibilidad 92+**.

---

## Referencias en el repo

- `src/app/sitemap.ts` — sitemap dinámico
- `src/lib/seo/build-sitemap-entries.ts` — URLs
- `src/components/seo/SiteJsonLd.tsx` — datos estructurados globales
- `src/lib/categorySeo.ts` — landings de categoría
- `src/app/layout.tsx` — metadata global
