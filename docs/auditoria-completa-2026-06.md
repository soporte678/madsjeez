# Auditoría completa Madsjeez — Junio 2026

**Método:** 5 agentes en paralelo (seguridad, SEO/contenido, frontend/UX/a11y, datos/catálogo, código/arquitectura), solo lectura, sobre `C:\temp-galaxy\madsjeez` + DB Supabase `doweovsukuskflgnxhhn` (queries SELECT en vivo). Hallazgos deduplicados y repriorizados.

---

## Veredicto

La **plataforma técnica es sólida** (checkout multi-pago, webhook MP con HMAC, OAuth firmado, indexación SEO bien gateada, legal con CUIT real, empty-states honestos en categorías). **No está lista para traer tráfico/vendedores reales** por tres bloqueantes: (1) métricas y testimonios **inventados** en páginas públicas, (2) el chatbot en su modo por defecto **contradice el modelo comercial** real, (3) **8 tablas sin RLS** + un sistema de **doorway pages** masivo. Todo es corregible.

### Números reales del catálogo (verificados en DB)

| Métrica | Real | vs. lo que se publica |
|---|---|---|
| Productos activos c/ stock y precio | **732** (743 totales, 82% import de MeLi) | "+10.000" en /quienes-somos |
| Vendedores | **3 cuentas = 1 misma persona** (Ezequiel Ziegler) | "+20 vendedores" |
| Órdenes (histórico) | **8** (total_sales = 0) | "~150 pedidos/mes" |
| Reviews | **0** | 6 testimonios "reales" publicados |
| Categorías con productos | **104 / 492** (388 vacías) | — (bien gateadas en sitemap) |
| Vendedores con MercadoPago | 2 de 3 | — |

---

## P0 — Crítico (legal + confianza + seguridad explotable)

| # | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| 1 | **Métricas inventadas** en página pública `/quienes-somos`: "+10.000 productos, +20 vendedores, +100 compradores, ~150 pedidos/mes". Real: 732 / 3 / 8 órdenes. Riesgo Ley 24.240 (defensa del consumidor / lealtad comercial). | `src/lib/social-proof.ts:3-16` → `src/app/quienes-somos/page.tsx:78-81` | Reemplazar por cifras reales o quitar la sección hasta tener volumen. |
| 2 | **Testimonios inventados** (6 quotes con nombres/fotos ficticios, "ya facturo el doble") bajo "Historias reales". DB: 0 reviews. | `src/lib/social-proof.ts:33-76`; `src/components/home/SellersTestimonialsSection.tsx:12-46` | Borrar o etiquetar como ilustrativos; recolectar reseñas reales. |
| 3 | **Chatbot contradice el modelo comercial** en su modo por defecto (`general`): afirma "comisión 10% por venta" + planes viejos "$8.000/$15.000/$25.000 + Enterprise" + "KYC para cobrar". El resto del sitio (y el prompt `seller`) dice 0% beta + Básico $0/Pro $29.999/Ultra $49.999. **Quedó a medio corregir de la sesión anterior** (se arreglaron `:170`/`:406` pero NO `:112-115`/`:130`). | `src/app/api/chat/route.ts:112-115,130` (default `general` en `:255`, `AIChatBot.tsx:49`) | Unificar TODO el archivo a 0% comisión + planes nuevos. Borrar `:112-115` y `:130`. |
| 4 | **8 tablas con RLS deshabilitado** expuestas a anon/authenticated key: `stores`, `store_themes`, `store_domains`, `store_categories`, `store_product_settings`, `store_events`, `mp_webhook_processed`, `paypal_webhook_processed`. Lectura/escritura con la anon key. | Supabase advisor (proyecto `doweovsukuskflgnxhhn`) | Definir políticas RLS y habilitarlas (NO habilitar sin políticas: bloquea todo). Tratar con prioridad. |

## P1 — Alto

| # | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| 5 | **Doorway pages masivas** `/comprar/[categoria]/en/[ciudad]` (~29 cat × 47 localidades ≈ hasta ~1.360 URLs casi idénticas, mismo inventario por categoría replicado por ciudad, sin `noindex`) + claims "vendedores **verificados**", "**Enviamos** a {ciudad}", "{count}+ con envío a {ciudad}" (conteo de categoría, no de ciudad). **Este es el sistema "localidades" real y ya está vivo** (no lo construí esta sesión). | `src/app/comprar/[categoria]/en/[ciudad]/page.tsx:24,83-85`; `src/lib/seo/comprar-landings.ts:103-156` | `noindex` a las combos sin inventario local (o reducir a ciudades con stock real). Quitar "verificados"/"Enviamos"/conteo engañoso. |
| 6 | **Webhook de Meta sin verificación de firma** `X-Hub-Signature-256` (acepta cualquier payload) + loguea el body completo (PII/teléfonos). | `src/app/api/meta/webhook/route.ts:27-53,31,42` | Verificar HMAC SHA-256 con `META_APP_SECRET` (patrón ya existe en webhook MP); no loguear payloads. |
| 7 | **Dark mode roto en páginas clave**: `/category/[slug]` (pública, alto tráfico SEO): root `bg-[#f7f8fb]` no oscurece + headings `text-slate-950` (fuera de los overrides de `globals.css`, que llegan a -900) quedan negros sobre cards oscuras. `ComprasView` ("Mis compras") y empty-state de `/search` con hex `text-[#333]/#666` invisibles en dark. | `src/app/category/[slug]/page.tsx:334,366+`; `src/components/dashboard/ComprasView.tsx:130-178`; `src/app/search/page.tsx:797` | Migrar a tokens (`text-foreground`/`bg-background`); añadir `text-slate-950/gray-950` a los overrides en `globals.css:672`. |
| 8 | **`/catalog` sirve datos demo hardcodeados** (productos Unsplash ficticios) en producción, nunca hace fetch real, y está **linkeado desde el footer**. | `src/app/catalog/page.tsx:24,129`; link en `src/components/seo/SiteSocialFooter.tsx:59` | Conectar a `/api/products` o eliminar ruta + link. |
| 9 | **`/help/[slug]` legacy vivo = duplicado** de `/ayuda/[slug]` con canonical self. El redirect 301 cubre `/help` pero NO las subpáginas. | `src/app/help/[slug]/page.tsx:22`; `next.config.ts:111-116` | Redirigir 301 `/help/[slug]`→`/ayuda/[slug]` o eliminar el árbol `/help/*` legacy. |
| 10 | **Banlist "gratis"/"0% comisión"** en la metadata de `/vender` ("Abrí tu tienda gratis", "0% comisión sobre tus ventas"). | `src/app/vender/page.tsx:5-7` | Alinear al framing honesto del resto del sitio. |
| 11 | **Pilares de contenido huérfanos**: ningún enlace desde home/footer/nav hacia `/comparativas`, `/reparacion`, `/marcas`, `/guias`, `/blog`, `/tutoriales`, `/ayuda-vendedores`. Solo breadcrumbs + sitemap. | `src/app/HomePageClient.tsx:368-381`; `src/components/home/HomeSeoContent.tsx` | Bloque de enlaces a pilares en el footer global (mayor retorno SEO). |

## P2 — Medio

| # | Hallazgo | Evidencia | Acción |
|---|---|---|---|
| 12 | Tokens MP y MeLi de vendedores **en texto plano** (existe `lib/integrations/crypto.ts` sin usar para estas tablas). | `seller/payment-gateway/mercadopago/callback/route.ts:141-143`; `meli/oauth/callback/route.ts:69-78` | Cifrar con `encryptJSON` en reposo. |
| 13 | **Email de soporte/legal inconsistente**: `company.ts` define `@madsjeez.com` pero 46 usos en 30 archivos usan `@madsjeez.com.ar`. Clientes podrían escribir a casilla inexistente. | `src/lib/company.ts:14-15` vs `chat/route.ts`, `aviso-legal:157`, `terminos:126` | Definir el dominio real y unificar desde `COMPANY`. |
| 14 | `typescript.ignoreBuildErrors: true` desactiva el type-check en build (deuda del "deploy urgente"; el tema Decimal ya está resuelto con `Number(p.price)`). | `next.config.ts:9` | CI `tsc --noEmit` (no bloqueante) → arreglar en tandas → reactivar. |
| 15 | **Doble fuente Prisma + Supabase** en 11 archivos (incl. `product/[id]`, `seller/[id]`, checkout MP) → lógica duplicada e inconsistencias de ID (ya hay heurísticas `isPrismaCatalogId` parchando). | `product/[id]/page.tsx:22-23`; `webhooks/mercadopago/route.ts:3-4` | Prisma como fuente única para catálogo/órdenes; Supabase solo auth/storage/realtime. |
| 16 | **Slug duplicado** `crear-cuenta` en TUTORIALES (seller + buyer) → el seller queda inaccesible. | `src/data/tutoriales.ts:98,453` | Renombrar uno (`crear-cuenta-vendedor`/`-comprador`). |
| 17 | **Sitemap de tutoriales incompleto**: 8 slugs hardcodeados vs ~24 en el data; ItemList JSON-LD emite 24. OG dice "8 guías". | `src/app/sitemap.ts:84-89`; `tutoriales/page.tsx` | Generar desde `TUTORIALES`; corregir copy. |
| 18 | **Referral code hardcodeado** `FUNDADOR-MJ` para todos (placeholder); la promesa "1 mes/1 año por referidos" no se puede atribuir. | `src/components/home/FoundingSellersSection.tsx:283` | Generar por usuario o desactivar el bloque. |
| 19 | FAQ de `/subscriptions` menciona "14 días gratis en plan **GOLD**" (plan inexistente; son Básico/Pro/Ultra). | `src/app/subscriptions/page.tsx:483-485` | Corregir copy. |
| 20 | Secreto de OAuth state MeLi con **fallback inseguro** `"meli-oauth-state-change-me"`. | `src/lib/meli/oauth-state.ts:4` | `throw` si falta el secreto (como ya hace MP). |
| 21 | **DDL en cada request**: `ALTER TABLE ADD COLUMN IF NOT EXISTS` vía `$executeRawUnsafe` en cada GET con error tragado. La migración ya existe. | `src/app/api/user/access-key/route.ts:10-18` | Borrar `ensureAccessKeyColumn()`. |
| 22 | **307 catch vacíos/solo-comentario** en 183 archivos → ceguera operativa. | varios; priorizar pagos/checkout/webhooks | `logger.error(...)` mínimo en cada catch. |
| 23 | Filtro PostgREST `.or()` por interpolación de input (filter-injection, no SQLi; mitigado por auth+rate-limit). | `src/app/api/ai/blog/route.ts:36-42` | Sanitizar keywords. |
| 24 | RPC `exec_sql` (SQL arbitrario) usado por Jarvis; gateado por auth admin, pero **verificar que la función NO esté expuesta a anon/authenticated** en PostgREST. | `jarvis/init/route.ts:54`; `lib/jarvis/mcp/supabase-mcp.ts` | `REVOKE EXECUTE ON FUNCTION exec_sql FROM anon, authenticated;` |

## P3 — Bajo / pulido

- **Header sin menú móvil**: `<nav>` con `hidden lg:flex` desaparece en mobile sin hamburguesa (`src/components/Header.tsx:27,49`). Verificar que `BottomNav` cubra.
- **Links de footer rotos**: `/about`, `/promotions` no existen (reales: `/quienes-somos`, `/offers`) en `coupons/page.tsx:256,258`, `offers/page.tsx:614,616`.
- **3 definiciones de Organization JSON-LD divergentes** (logos/sameAs/nombre distintos), 2 sin usar; sin grafo global. Consolidar `SiteJsonLd` en el layout raíz.
- **Branding inconsistente** "MadsJeez" vs "Madsjeez" en titles/JSON-LD.
- **`/sell` en sitemap** (form auth-gated, no indexable).
- **Dead code**: `src/components/ProductCard.tsx` (0 usos, vive `product/ProductCard.tsx`), `src/components/layout/Header.tsx` (0 usos), 2 librerías de charts (recharts + chart.js).
- **Rutas de listado solapadas**: `/products`, `/catalog`, `/offers`, `/deals` (4 listados, 3 implementaciones). Consolidar + 301.
- **256 `any`** + **455 `console.*` crudos** (el logger sanitiza, los console no).
- **catalog.xml build error**: añadir `export const dynamic = "force-dynamic"` a `api/meta/catalog.xml/route.ts:17` para limpiar el `[ERROR]` de build.
- **TODOs reales**: borrado de cuenta sin implementar (`ProfilePrivacyView.tsx:126`), PayPal evento→orden sin mapear (`webhooks/paypal/route.ts:97`), `/blog/generador` (IA con costo) sin auth.

---

## Lo que está BIEN (verificado)

- **Pagos/OAuth**: webhook MP con HMAC SHA-256 + timing-safe + anti-skew + idempotencia (ejemplar); OAuth MP/MeLi con state firmado + anti-replay.
- **Indexación SEO**: gate ≥5 productos en stock para indexar categorías; sitemap excluye las 388 vacías → sin index bloat. Consolidación 301 de categorías duplicadas.
- **Contenido de los pilares nuevos** (comparativas/marcas/reparación/guías/ayuda): honesto, no-thin, con disclaimers "no distribuidor oficial", "verificá compatibilidad", framing beta. Cumple las reglas.
- **Empty-state de categorías** honesto; **checkout sin MP** con mensaje claro + restauración de stock.
- **Legal**: sin placeholders; CUIT real publicado; service-role solo server-side; secrets no hardcodeados; logger con redacción; `prefers-reduced-motion` respetado; sin `<img>` sin alt.

## Plan de acción sugerido (orden)

1. **P0 confianza** (rápido, alto impacto): borrar/reemplazar métricas (`social-proof.ts`) y testimonios; unificar chatbot a 0% comisión (`chat/route.ts:112-130`).
2. **P0 seguridad**: políticas RLS para las 8 tablas; firma del webhook de Meta.
3. **P1 SEO**: `noindex` a doorway `/comprar/.../en/...`; 301 `/help/[slug]`; quitar "gratis" de `/vender`; internal linking de pilares en footer; arreglar `/catalog` demo.
4. **P1 UX**: contraste dark en `/category`, `ComprasView`, `/search`.
5. **P2**: cifrar tokens, unificar email, slug tutoriales, sitemap tutoriales, referral, fallback secreto MeLi, exec_sql revoke.
6. **P3**: limpieza (dead code, JSON-LD, branding, force-dynamic catalog.xml, consolidar listados).

**Requiere decisión del dueño / datos reales**: cifras reales para social proof; dominio de email; qué hacer con el sistema doorway de ciudades; cargar catálogo/vendedores reales.
