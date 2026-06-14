# Auditoría Madsjeez — FASE 0 (read-only)

Fecha: 2026-06-13 · Método: análisis del código + datos reales de Supabase + 3 auditores en paralelo (placeholders/textos internos, cloaking, modelo de negocio/legal/checkout). **No se modificó nada.**

---

## Resumen ejecutivo

| Preocupación del diagnóstico | Veredicto |
|------------------------------|-----------|
| Catálogo vacío | ❌ **Falsa alarma** — 732 productos activos con stock y precio |
| Cloaking SEO (contenido distinto para Google) | ❌ **Falsa alarma** — verificado técnicamente, no existe |
| Placeholders legales activos | ✅ **Real** — `[Dirección…]` visible en 3 páginas legales |
| Modelo de negocio inconsistente | ✅ **Real** — sitio dice "0% comisión" pero el **chatbot dice 10%** |
| Categorías vacías | ✅ **Real** — 389 de 492 categorías sin productos (79%) |
| Textos internos "SEO" visibles | ✅ **Real (menor)** — jerga en `/vender` y `/vender/auditoria` |
| Checkout no operativo | ⚠️ **Parcial** — funciona (MP/PayPal/transfer), pero UX a mejorar |
| Datos de empresa/footer | ✅ **OK** — reales (CUIT, dirección, emails, fundador) |

**Conclusión:** Madsjeez NO es un prototipo roto: tiene catálogo real (732 productos), checkout funcional y datos de empresa reales. Los problemas concretos son acotados: placeholders legales, la contradicción del chatbot sobre comisión, categorías vacías y algo de jerga interna visible.

---

## 1–9. Stack y estructura
- **Framework:** Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind v4 (tema con `data-theme`).
- **Datos:** Prisma + Supabase (Postgres + RLS). **Auth:** NextAuth (Credentials + Google). **Deploy:** Railway (Docker standalone, deploy desde `main`).
- **Rutas:** App Router en `src/app/**` (carpetas = rutas).
- **Layout/header/footer/nav:** root `layout.tsx` + `Navbar` + `SiteCompanyFooter`/`SiteSocialFooter`/`SiteNetworkFooter` (datos reales).
- **Componentes reutilizables:** `src/components/**` (ui/, seo/, seller/, storefront/, product/…). Sistema SEO propio (`src/lib/seo/**`, `BreadcrumbJsonLd`, `FaqJsonLd`, `OrganizationJsonLd`).

## 10–13. Productos / vendedores / checkout / auth
- **Productos (Supabase, datos reales):** 743 totales, **737 activos**, **732 activos con stock y precio**. Catálogo real y sellable.
- **Vendedores:** 3 (beta chico). **Tiendas:** 3.
- **Checkout:** **funcional end-to-end** — `cart → checkout` (3 pasos: envío → pago → confirmación), `POST /api/checkout/mp`. Medios: **Mercado Pago, PayPal, transferencia**. Valida que el vendedor tenga MP conectado (`SELLER_MP_NOT_CONNECTED`) — pero **muestra el botón de MP aunque el vendedor no lo haya configurado** (falla recién al enviar; no ofrece WhatsApp como alternativa en el checkout). WhatsApp sí existe en la ficha de producto.
- **Auth:** NextAuth JWT; gating admin/driver en middleware; RLS en datos sensibles.

## 14–19. SEO técnico
- **Sitemap** (`src/app/sitemap.ts`): dinámico, **con gate de indexación por inventario** (categorías con ≥5 productos; evita indexar vacías). Incluye productos, categorías con stock, tiendas, landings, blog/guías.
- **robots** (`src/app/robots.ts`): permisivo; disallow `/admin/`, `/api/`, `/checkout`, `/cart`, `/account/`, `/dashboard/`. Una sola regla `*` (sin trato distinto a bots).
- **Metadata/canonical/OG:** por página (cada ruta importante tiene title/description/canonical/OG únicos). **Schema:** Organization + WebSite/SearchAction + Product (en productos reales) + Breadcrumb + FAQ + BlogPosting.

## 20–21. Categorías y catálogo
- **492 categorías** en DB, pero **solo 103 tienen al menos un producto activo con stock** → **389 vacías (79%)**.
- El sitemap ya NO indexa las vacías (gate ≥5). **Pero** el menú/listados pueden mostrar categorías sin productos como si tuvieran → falta mensaje honesto / ocultarlas.

## 22. Placeholders legales (REAL — visible al usuario)
- `src/app/legal/terminos/page.tsx:127` → `Dirección: [Dirección de la empresa]`
- `src/app/legal/aviso-legal/page.tsx:158` → `Dirección: [Dirección postal]`
- `src/app/legal/privacidad/page.tsx:117` → `Dirección postal: [Dirección de la empresa]`
- (El resto de los datos legales son reales: razón social MADSJEEZ COMMERCE GROUP S.R.L., CUIT 20-31264840-8, fundador, emails, ley 25.326/24.240.)

## 23. Textos internos visibles (REAL — menor)
- `/vender` (`VenderClient.tsx:31,82`): "Medición de tráfico orgánico, pago, directo y referral", "UTM, origen de visita y canal de adquisición… desde el panel admin" — jerga de marketing interno visible al vendedor.
- `/vender/auditoria` (`page.tsx:28,31`): "Crear landing SEO por rubro…", "Medir origen de visitas para separar orgánico, pago, referido y social".
- `/blog/generador` (`BlogClient.tsx:89`): subtítulo "Generador de contenido SEO automático para atraer tráfico" (la página ya es `noindex`).
- `demo/mock/test/TODO/FIXME`: **solo en comentarios/variables** (no visibles). Seguro.

## 24. Rutas duplicadas
- `/coupons` y `/coupons/public`: **casi gemelas** (browse de cupones). Candidatas a unificar (redirect una → otra) en una fase de limpieza.
- No se detectaron otras duplicaciones de rutas públicas.

## 25–26. Cloaking — **FALSA ALARMA (verificado)**
- Middleware: solo canonical apex→www, gating admin/driver, cache headers Jarvis, rewrite de subdominios de tienda. **Sin lógica por user-agent que cambie contenido.**
- Sin detección de bot que altere HTML; sin bloques `display:none`/`sr-only` con keywords; sin contenido distinto por referer/query/header. `generateMetadata` depende solo de params/DB, no de headers.
- **Veredicto: NO hay cloaking.** Dejar documentado como falsa alarma.

## 27. Modelo de negocio — **CONTRADICCIÓN REAL**
- Todo el sitio público dice **"0% comisión por venta — siempre"** (home, planes, /vender, /subscriptions, términos). Modelo real = **monetización por suscripción** (PLATA/GOLD $29.999, PLATINUM $49.999).
- **PERO** el chatbot (`src/app/api/chat/route.ts:170,406`) dice **"La comisión es del 10% por venta"** → contradice todo el resto. **Único punto inconsistente.**
- Además "0% … siempre" es una promesa fuerte ("siempre") que conviene matizar a "durante la etapa beta / lanzamiento inicial".

## 28. Qué corregir primero (resumen)
1. Placeholders legales `[Dirección…]` (3 páginas) → poner la dirección real (ya está en `COMPANY`) o quitar el campo.
2. Contradicción de comisión del chatbot (10% → 0% / beta).
3. Categorías vacías → ocultar del menú o mensaje honesto + CTA captación.
4. Jerga interna en `/vender` y `/vender/auditoria` → reescribir a copy de usuario.
5. UX checkout: no mostrar MP si el vendedor no lo configuró + ofrecer "Consultar por WhatsApp".

## 29. Qué NO conviene tocar
- El **sitemap/robots/SEO** (ya están bien y con gate de indexación).
- El **checkout funcional** (no romperlo; solo mejorar el UX de fallback).
- Los **datos de empresa** (son reales).
- Todo lo construido esta sesión (store builder, landings, cupones) ya deployado.

## 30. Plan de implementación por prioridad

**PRIORIDAD 1 (confianza/legal/coherencia — bajo riesgo, alto impacto):**
- [x] Reemplazar `[Dirección…]` en términos/aviso-legal/privacidad por `COMPANY.address.full` (dato real, ya público en el footer).
- [x] Corregir el chatbot: comisión "10%" → mensaje único coherente ("0% durante la beta + planes opcionales Básico $0 / Pro / Ultra").
- [x] Matizar "0% comisión **siempre**" → "0% durante la etapa beta; las condiciones pueden actualizarse e informarse oportunamente".
- [x] Reescribir la jerga interna de `/vender` y `/vender/auditoria` a copy orientado al vendedor (sin "UTM/tráfico orgánico/landing SEO").

**PRIORIDAD 2 (catálogo honesto + UX):**
- [x] Categorías vacías: empty-state honesto "Estamos cargando productos en esta categoría… Sumá tu catálogo". Quitada toda la jerga SEO interna visible de `/category/[slug]`. Indexación gateada (≥5 productos).
- [~] Checkout: el flujo ya muestra un error claro `SELLER_MP_NOT_CONNECTED` al enviar (no es engañoso) → aceptable. Mejora opcional (ocultar MP de entrada + fallback WhatsApp) queda como pendiente menor.
- [x] Unificar `/coupons` ↔ `/coupons/public` (301 `/coupons`→`/coupons/public`).

**PRIORIDAD 3 (SEO útil — completado en lotes para evitar thin content):**
- [x] Centro de ayuda `/ayuda` (hub + 10 artículos compradores) + `/ayuda-vendedores` (hub + 10 artículos vendedores). Redirect 301 `/help`→`/ayuda`.
- [x] Guías de reparación/mantenimiento `/reparacion` (hub + 12 guías: no arranca, mezcla 2T, lubricación, afilado, carburador, identificar repuesto por medidas, cuándo ir al service — pistón/cardán/bobina/embrague encarados como señales para taller, sin teardown riesgoso). Verificado `/diagnostico` OFF → sin duplicar PartsVision.
- [x] `/comparativas` (hub + 6 tipo-vs-tipo) y `/maqjeez-y-madsjeez`.
- [x] `/marcas` (hub + 7 marcas con resultados reales en catálogo: niwa, gamma, stihl, lusqtoff, omaha, honda, shizen) — framing "no distribuidor oficial / originales o compatibles según el vendedor", sin logos.
- [~] `/localidades` — **NO construido a propósito**: con 3 vendedores y sin inventario realmente local serían *doorway/thin pages* que penalizan el dominio (contra la regla "no thin content"). Reabrir cuando haya señal local real (vendedores por zona / stock geolocalizado).

## 31. Estado final FASE 0–10 (sesión)
- **P1, P2 y P3** implementados y deployados a producción (Railway, `main`). Cada lote: build "Compiled successfully" → push → deploy SUCCESS → smoke test 200 en vivo.
- **Hallazgo de datos:** `Product` no tiene campo `brand`; las marcas viven en el título y el catálogo es mayormente compatible/aftermarket → por eso `/marcas` usa framing honesto y solo marcas con matches reales.
- **Pendientes del dueño:** publicar (o no) CUIT en legales; validación legal/contable final; decidir si se reabre `/localidades` con señal local; mejora opcional de UX de checkout (fallback WhatsApp).

**Requiere DATOS REALES del dueño:** ¿publicar la dirección postal completa en legales? ¿confirmar el modelo (0% beta vs planes)?
**Requiere ABOGADO/CONTADOR:** revisión final de términos/privacidad/aviso-legal antes del lanzamiento formal (ya tienen base sólida; falta validación profesional).
**Requiere CONFIG EXTERNA:** `PAYPAL_WEBHOOK_ID` en Railway (si se activa PayPal); IDs de analytics ya existen (GA4 `G-ZXW730DHRB`, GTM).
