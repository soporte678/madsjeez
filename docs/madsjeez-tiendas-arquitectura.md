# Madsjeez Tiendas — Arquitectura y plan

Store builder multi-tenant dentro del marketplace: cada vendedor con su tienda pública
personalizable, link compartible y (avanzado) dominio propio. **Sin copiar Tiendanube/Shopify.**

Estado: análisis del stack completo + landing `/crear-tienda-online` implementada. El resto está
planificado por fases (abajo). Build verificado.

---

## 1. Resumen de arquitectura (decisión clave)

El marketplace **ya modela "tienda" como el propio vendedor** (`User`), no como entidad separada:

- Storefront público vivo en `src/app/tienda/[slug]/page.tsx`, resuelve por `User.storeSlug`.
- Productos: `Product.sellerId → User`. Categorías: globales del marketplace.
- Helpers: `src/lib/public-store.ts` (`getPublicStoreBySlug`, `ensureStoreSlugForUser`), `src/lib/store-slug.ts`.
- Panel mínimo: `/dashboard/mi-tienda` (`StorePublicPanel`) — hoy sólo edita el slug.

**Decisión recomendada (no rompe nada):** mantener `User` como identidad de la tienda (1 vendedor = 1 tienda),
y **agregar tablas nuevas sólo para lo que falta**, en vez de migrar storefront + productos a un `Store` nuevo:

| Tabla nueva | Para qué | Notas |
|-------------|----------|-------|
| `StoreProfile` (1:1 con User) | branding + diseño + SEO + datos de tienda | logo, banner, descripción corta, whatsapp, email, redes, themeId, primaryColor, secondaryColor, font, layout, cardStyle, flags (showWhatsapp/showLocation/showSocial), seoTitle, seoDescription, ogImage, primaryDomainType, isActive, isVerified |
| `StoreDomain` | dominios/subdominios | storeId(userId), domain, type (internal\|subdomain\|custom), verificationToken, dnsStatus, sslStatus, isPrimary, verifiedAt, lastCheckedAt |
| `StoreCategory` | categorías propias de la tienda | storeId(userId), name, slug, order |
| `StoreProductSettings` (o columnas en pivot) | destacar/ordenar/ocultar productos por tienda | storeId, productId, featured, sortOrder, hidden, storeCategoryId |
| `StoreEventDaily` (opcional) | stats agregadas (visitas, clicks) | o reutilizar `/api/traffic/track` existente |

Esto respeta las reglas: no duplica productos (siguen en `Product`), no rompe el storefront ni el checkout,
y deja todo escalable y multi-tenant. La "entidad Store" del PRD se implementa como `StoreProfile`+relacionadas
keyed por `userId` (el `ownerUserId` del PRD = `User.id`).

---

## 2. Hallazgo CRÍTICO de infraestructura (dominios + SSL)

El deploy es **Railway, Docker standalone, 1 servicio, 1 dominio (`www.madsjeez.com.ar`)**. Hoy:

- `src/middleware.ts` **redirige TODO `*.madsjeez.com.ar` → `www`** (canonical redirect). Es decir, hoy los
  subdominios están **activamente bloqueados**.
- No hay wildcard DNS (`*.madsjeez.com.ar`), ni reverse proxy, ni Cloudflare.

Consecuencias para los 3 niveles de URL del PRD:

| Nivel | Estado | Qué requiere |
|-------|--------|--------------|
| **1. `/tienda/[slug]`** (path) | ✅ Funciona hoy | Sólo mejorar el storefront. **Cero infra.** |
| **2. `nombre.madsjeez.com.ar`** (subdominio) | ⚠️ Bloqueado por middleware + sin DNS | Wildcard CNAME `*.madsjeez.com.ar` en DonWeb + ajustar middleware para resolver por host. Railway sirve el wildcard con su SSL. **~1 día + acción DNS.** |
| **3. `www.tumarca.com.ar`** (dominio propio) | ❌ No posible solo con Railway | Railway **no provee SSL dinámico por tenant**. Necesita **Cloudflare for SaaS** (gestionado) **o** un reverse proxy propio (Caddy/Traefik con ACME). El módulo (schema+UI+verificación DNS/TXT) sí se puede construir ya; la **activación HTTPS real es la pieza de infra**. |

> Por eso el PRD lo previó: "si el despliegue no permite dominios personalizados todavía, dejarlo armado
> como fase 2 con documentación clara". El **módulo de dominios** (instrucciones DNS, token TXT, estados
> pending/dns_pending/verified/ssl_pending/active/failed/disconnected, verificar/desconectar/principal) se
> construye igual; lo que queda gateado a infra es el **emisor de SSL**.

### Recomendación SSL (cuando se active dominio propio)
- **Opción recomendada: Cloudflare for SaaS (Custom Hostnames).** El vendedor hace CNAME `www.sudominio` →
  `domains.madsjeez.com.ar`; Cloudflare emite/renueva el cert por hostname y proxya al origen Railway. Menos
  ops que un proxy propio. Costo según plan Cloudflare.
- **Alternativa: Caddy/Traefik** como servicio Railway delante de la app (ACME on-demand). Más control, más ops (~USD 20-30/mes).
- **Mientras tanto:** Niveles 1 y 2 cubren la mayoría de los casos sin costo extra.

---

## 3. Plan por fases

| Fase | Entrega | Infra | Estado |
|------|---------|-------|--------|
| **0** | Análisis del stack + landing `/crear-tienda-online` | — | ✅ HECHO |
| **1** | Modelo de datos (`Store`, `StoreTheme`, `StoreDomain`, `StoreCategory`, `StoreProductSettings`) + migración SQL + helpers (slugs reservados, resolución por host) | Migración pendiente de aplicar a Supabase | ✅ HECHO (migración sin aplicar) |
| **2** | Panel "Mi tienda": config básica + diseño (colores/fuente + preview en vivo) + SEO (con preview Google) + dominios (UI). API `/api/seller/store` (GET get-or-create + PATCH validado, ownership, plan-gating) + `/slug-check`. Sincroniza al storefront legacy. Logo/banner por URL (upload de archivo = follow-up); selector de productos por tienda = F3 | — | ✅ HECHO (núcleo) |
| **3a** | Storefront público temable: header con logo+nombre+buscador, banner (imagen o gradiente con color de marca), descripción, botón WhatsApp, redes, ubicación, productos reales, footer "Tienda creada con Madsjeez", SEO dinámico (seoTitle/description/OG) + schema Store con address. Resuelve por slug y subdominio | — | ✅ HECHO |
| **3b** | Onboarding en pasos (`/dashboard/mi-tienda/crear`): nombre+slug → rubro/datos → diseño → productos → publicar → fin. UI guiada sobre `/api/seller/store` | — | ✅ HECHO |
| **4** | Subdominios `nombre.madsjeez.com.ar`: middleware resuelve por host (rewrite root → `/tienda/<label>`, resto → www) + resolución `getPublicStoreByHandle` (storeSlug legacy → `Store.subdomain`/`slug`) | **Falta wildcard DNS** `*.madsjeez.com.ar` → Railway + agregar el wildcard en Railway custom domains | ✅ HECHO (código); pendiente acción DNS |
| **5** | Módulo dominios propios: API add/verify(DNS TXT)/principal/desconectar + UI (token, instrucciones CNAME+TXT, estados) | SSL no activado a propósito (Cloudflare for SaaS / proxy, etapa posterior) | ✅ HECHO (stub funcional, sin SSL) |
| **6a** | Viral: tab "Compartir" con copiar link, WhatsApp, Facebook, **QR descargable** (lib `qrcode`), **flyer descargable** (canvas), badge embebible + analytics `store_share_click`. Plan-gating ya activo (subdominio Pro, dominio Premium) | — | ✅ HECHO |
| **6b** | Estadísticas reales por tienda: tabla `store_events` (migrada), tracking por beacon desde el storefront (`/api/stores/track`), agregación owner-only (`/api/seller/store/stats`), tab "Estadísticas" (visitas, clicks producto/WhatsApp, compartidos, top productos, total + 30 días). **Datos reales, sin inventar** | — | ✅ HECHO |

---

## 4. Reutilización (no reinventar)

- **Auth/ownership:** `getServerSession(authOptions)` + `where: { sellerId: session.user.id }` (patrón ya usado en products/claims).
- **UI:** `src/components/ui/*` (Button, Input, Card, Tabs, Switch, Badge…), toast `sonner`, tokens Tailwind v4.
- **Uploads:** patrón `src/app/api/flash/photos/upload/route.ts` → Supabase Storage + signed URL (nuevos buckets `store-logos`, `store-banners`).
- **Planes:** `getEffectiveTier` + `/api/me/subscription-status` (FREE/PLATA/GOLD/PLATINUM).
- **SEO:** `BreadcrumbJsonLd`, `FaqJsonLd`, `canonicalMeta`, sitemap; nuevo `/sitemap-stores.xml`.
- **Analytics:** `trackEvent`; agregar eventos `store_*` (y al allowlist interno los que se quieran auditar).
- **Slug:** `slugifyStoreName` + lista de slugs reservados (admin, api, www, app, dashboard, login, checkout, tienda, soporte, ayuda, vendedor, productos, categorias, madsjeez).

---

## 5. Riesgos técnicos

1. **Migración en prod (Supabase):** aditiva (tablas nuevas) → bajo riesgo de datos, pero se aplica sobre DB viva. Hacer en rama + revisar SQL antes.
2. **Middleware para subdominios:** hoy redirige `*` → www. Cambiarlo mal puede afectar el canonical SEO o el auth. Cambio quirúrgico + pruebas.
3. **SSL dominios propios:** depende de infra externa (Cloudflare/proxy); sin eso, el nivel 3 queda en "verificado pero no activo".
4. **Indexación:** sólo tiendas activas con productos (gatear igual que categorías, MIN_INDEX). Evitar tiendas vacías/borrador/suspendidas en sitemap.
5. **Colisión de slug/dominio:** unicidad a nivel DB + chequeo de dominios ya usados por otra tienda + no permitir dominios core de Madsjeez.

---

## 6. Checklist de prueba (cuando esté F1-F3)

Crear tienda con slug único · evitar duplicados · evitar slugs reservados · editar logo/banner · cambiar colores ·
agregar productos · ver tienda pública · copiar link · compartir WhatsApp · metadata SEO · mobile · agregar dominio ·
token TXT · verificar DNS · activar dominio · render desde dominio externo · desconectar · 404 si no existe ·
un vendedor no puede editar tienda ajena · tiendas inactivas no indexan.

---

## 7. Próximos pasos (decisiones pendientes del usuario)

1. **Migración F1 a Supabase:** ¿la aplico a producción o la dejo en archivos para que revises primero?
2. **Camino de SSL para dominio propio (F5):** subdominios-primero (recomendado) / Cloudflare for SaaS / proxy Caddy / decidir luego (construyo el módulo stubbeado).
