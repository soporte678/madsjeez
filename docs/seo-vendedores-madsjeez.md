# SEO captación de vendedores — Madsjeez

Implementación de un cluster de landings para posicionar por búsquedas de vendedores
("vender productos online", "marketplace para emprendedores", "alternativa a Mercado Libre", etc.)
y capturar leads con formulario + medición.

Fecha: 2026-06-13 · Build verificado: las 11 rutas prerenderan como estáticas (○, revalidate 1d).

---

## 1. Páginas creadas (11)

Arquitectura **data-driven**: una fuente de contenido (`src/data/seller-landings.ts`) + un template
(`SellerLanding`) renderizan todas las rutas. Agregar una landing nueva = 1 entrada de datos + 1 route file.

| # | URL | Keyword principal | Rol |
|---|-----|-------------------|-----|
| 1 | `/vender-en-madsjeez` | vender productos online Argentina | **Hub canónico** — todo enlaza acá |
| 2 | `/alternativa-a-mercado-libre` | alternativa a Mercado Libre Argentina | Captar vendedores que quieren otro canal |
| 3 | `/donde-vender-mis-productos` | dónde vender mis productos online | Intención directa |
| 4 | `/publicar-productos-online` | publicar productos online | Intención directa |
| 5 | `/vender-sin-pagina-web` | vender online sin página web | Intención directa |
| 6 | `/vender-repuestos-online` | vender repuestos online | Rubro |
| 7 | `/vender-ferreteria-online` | vender productos de ferretería online | Rubro |
| 8 | `/vender-productos-mayoristas-online` | vender productos mayoristas online | Rubro |
| 9 | `/marketplace-para-emprendedores` | marketplace para emprendedores | Segmento |
| 10 | `/como-vender-por-internet` | cómo vender por internet | Guía/intención |
| 11 | `/sumar-vendedores` | sumar negocio a marketplace | **Landing de campaña** (Ads/Meta), corta, 100% conversión |

**Decisión SEO sobre `/vender` (existente):** sigue funcionando, pero su `canonical` ahora apunta a
`/vender-en-madsjeez` y se quitó del sitemap, para consolidar la señal en el hub y no competir por
la misma intención. (Si preferís un 301 duro `/vender → /vender-en-madsjeez`, se agrega en `next.config.ts`.)

---

## 2. Keywords secundarias cubiertas (en H2 y prosa)

Cada página ataca su keyword principal en `<h1>`, `<title>` y `meta description`, y keywords secundarias
en los `<h2>` y el cuerpo. Cubiertas a lo largo del cluster: *dónde vender mis productos, vender por internet
Argentina, marketplace argentino para vendedores, plataforma para vender productos online, publicar productos,
vender sin depender de redes, marketplace de repuestos, ferretería online, mayoristas, emprendedores, comercios,
sumar un canal de venta*.

> Sin promesas de "gratis" / "comisión cero" en el contenido nuevo (no se prometió nada no implementado).
> Sobre Mercado Libre: enfoque "sumá un canal", sin difamar.

---

## 3. Componentes creados

| Componente | Archivo | Tipo |
|------------|---------|------|
| `SellerLanding` (template completo) | `src/components/seller/SellerLanding.tsx` | Server |
| `SellerLeadForm` (formulario captación) | `src/components/seller/SellerLeadForm.tsx` | Client |
| `SellerCtaButton`, `SellerWhatsApp`, `SellerPageView` | `src/components/seller/SellerInteractive.tsx` | Client |
| Datos + tipos de las landings | `src/data/seller-landings.ts` | — |
| Builder de metadata (title/desc/canonical/OG/Twitter) | `src/lib/seo/seller-landing-meta.ts` | — |

El template compone: **breadcrumb visible, hero con CTAs, beneficios, cómo funciona (3 pasos),
rubros, comparativa, prosa SEO (H2), formulario, FAQ (`<details>`), enlazado interno y CTA final.**
Todo con tokens semánticos (`--primary`, `--card`, `--foreground`…) → dark mode seguro, mobile-first.

---

## 4. Formulario de vendedores

- **Endpoint:** `POST /api/seller/leads` (ya existía) → tabla `seller_leads` (modelo Prisma `SellerLead`), dedup por email.
- **Campos:** Nombre*, Negocio, Rubro (select), WhatsApp, Email*, Provincia/localidad, Cantidad de productos,
  "¿Dónde vendés hoy?" (select), Mensaje. Provincia y canal actual se componen en `message` (sin migración).
- **Mensaje de éxito:** "¡Gracias! Recibimos tus datos. El equipo de Madsjeez va a contactarte…"
- **Gestión de leads:** ya existe panel admin `/admin/seller-leads` + PATCH de estado (NEW → CONTACTED → ACTIVATED → SELLING).

---

## 5. Eventos de analytics (GA4 / GTM vía `trackEvent`)

| Evento | Cuándo se dispara |
|--------|-------------------|
| `seller_page_view` | al montar cada landing |
| `seller_cta_click` | click en CTAs ("Quiero vender", "Ver cómo funciona") |
| `seller_register_click` | click en "Crear cuenta de vendedor" (→ `/seller/register`) |
| `seller_form_start` | primer foco en el formulario |
| `seller_form_submit` | envío exitoso del formulario |
| `seller_whatsapp_click` | click en botón de WhatsApp |
| `generate_lead` + `contact_whatsapp` | espejados a analítica interna (`/api/traffic/track`) |

Todos llevan `source` = slug de la landing → permite saber **qué página/keyword trae vendedores reales**.

---

## 6. Schema markup (JSON-LD)

Por página: **WebPage** (inline) + **BreadcrumbList** (`BreadcrumbJsonLd`) + **FAQPage** (`FaqJsonLd`).
A nivel sitio (ya existían en el layout): **Organization** + **WebSite**.
El hub y páginas con rubros incluyen la grilla de rubros como navegación interna.

---

## 7. Sitemap y robots

- **Sitemap** (`src/app/sitemap.ts`): se agregan las 11 landings con `priority` 0.7–0.95 vía
  `SELLER_LANDINGS.map(...)`. Se quitó `/vender` (su canonical apunta al hub).
- **Robots** (`src/app/robots.ts`): permisivo, no bloquea ninguna landing. **Sin cambios necesarios.**
- Todas las páginas son **indexables** (sin `noindex`) y están en el sitemap.

---

## 8. Cómo enviarlas a Google Search Console

1. Entrá a Search Console → propiedad `https://www.madsjeez.com.ar`.
2. **Sitemaps** → confirmá que `sitemap.xml` esté enviado (ya lo está). Google detectará las nuevas URLs.
3. **Inspección de URL** (para acelerar): pegá cada URL del listado del punto 1 y tocá **"Solicitar indexación"**.
   Priorizá: `/vender-en-madsjeez`, `/alternativa-a-mercado-libre`, `/donde-vender-mis-productos`.
4. **Prueba de resultados enriquecidos** (search.google.com/test/rich-results): validá el FAQ/Breadcrumb de
   `/vender-en-madsjeez`.
5. A los días, revisá **Cobertura/Páginas** para confirmar que quedaron "Indexadas".

Lista para copiar/pegar:
```
https://www.madsjeez.com.ar/vender-en-madsjeez
https://www.madsjeez.com.ar/alternativa-a-mercado-libre
https://www.madsjeez.com.ar/donde-vender-mis-productos
https://www.madsjeez.com.ar/publicar-productos-online
https://www.madsjeez.com.ar/vender-sin-pagina-web
https://www.madsjeez.com.ar/vender-repuestos-online
https://www.madsjeez.com.ar/vender-ferreteria-online
https://www.madsjeez.com.ar/vender-productos-mayoristas-online
https://www.madsjeez.com.ar/marketplace-para-emprendedores
https://www.madsjeez.com.ar/como-vender-por-internet
https://www.madsjeez.com.ar/sumar-vendedores
```

---

## 9. Checklist de indexabilidad

- [x] Status 200 (prerender estático verificado en build)
- [x] `<title>`, `meta description` y `canonical` únicos por página
- [x] `<h1>` único por página + `<h2>` con keywords secundarias
- [x] Sin `noindex` (robots permisivo)
- [x] En sitemap.xml
- [x] JSON-LD WebPage + BreadcrumbList + FAQPage
- [x] Enlazado interno bidireccional (todas → hub; hub → cluster)
- [x] Mobile-first + dark mode (tokens semánticos)
- [ ] Confirmar en GSC "Indexada" (manual, post-deploy)
- [ ] Validar rich results (manual)

---

## 10. Blog SEO (fase 2 — IMPLEMENTADO)

Blog público data-driven en `/blog` con 10 artículos. Cada artículo enlaza a su landing del cluster
(blog → landing → hub) y tiene CTA con tracking. Datos en `src/data/blog-posts.ts`; render en
`src/app/blog/page.tsx` (índice) y `src/app/blog/[slug]/page.tsx` (artículo: TOC, FAQ, schema BlogPosting +
Breadcrumb + FAQPage, notas relacionadas).

> **Cambio de ruta:** el `/blog` anterior era una **herramienta interna de generación de artículos con IA**
> (no contenido público). Se reubicó a **`/blog/generador`** (`noindex`, sigue 100% funcional). Recomendado:
> moverla bajo `/admin` para gating de auth (usa `/api/ai/blog`, que tiene costo).

| URL | Tema | CTA → landing |
|-----|------|---------------|
| `/blog/donde-vender-productos-online-argentina` | Dónde vender online | donde-vender-mis-productos |
| `/blog/como-vender-por-internet-sin-pagina-web` | Vender sin web | vender-sin-pagina-web |
| `/blog/que-es-un-marketplace-para-emprendedores` | Qué es un marketplace | marketplace-para-emprendedores |
| `/blog/alternativas-para-vender-fuera-de-mercado-libre` | Alternativas a ML | alternativa-a-mercado-libre |
| `/blog/como-publicar-productos-online-y-conseguir-clientes` | Publicar y conseguir clientes | publicar-productos-online |
| `/blog/como-vender-repuestos-online-argentina` | Vender repuestos | vender-repuestos-online |
| `/blog/como-vender-productos-mayoristas-por-internet` | Vender mayorista | vender-productos-mayoristas-online |
| `/blog/whatsapp-instagram-marketplace-juntos` | Combinar canales | vender-en-madsjeez |
| `/blog/que-necesita-un-emprendedor-para-vender-online` | Checklist emprendedor | marketplace-para-emprendedores |
| `/blog/como-crear-una-buena-publicacion-de-producto` | Anatomía de una publicación | publicar-productos-online |

Todos en sitemap (`/blog` + 10 posts). `/blog/generador` queda fuera del sitemap y con `noindex`.

---

## 11. Próximos pasos recomendados

1. **Deploy** (Railway) y solicitar indexación en GSC (punto 8 + las 10 URLs del blog).
2. **OG image dedicada** por landing/artículo (hoy usan la global) para mejorar CTR al compartir.
3. **A/B test** del H1/CTA del hub y de `/sumar-vendedores` (medible ya con `seller_cta_click`/`seller_form_submit`).
4. (Opcional) 301 duro `/vender → /vender-en-madsjeez` si se decide unificar del todo.
5. (Recomendado) Mover `/blog/generador` bajo `/admin` para protegerlo con auth.
6. Cuando haya leads reales, sumar **testimonios** (placeholder previsto) para subir conversión.
