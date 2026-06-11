# MASTER EXECUTION PLAN — Madsjeez

Coordinador (Agente 0). Estado consolidado de la auditoría Fase 0 + plan de oleadas.
Actualizado: 2026-06-05.

## Stack detectado
Next.js 16 (App Router/RSC) · React 19 · Prisma · Supabase (Postgres + PostGIS) ·
Railway · NextAuth · MercadoPago/PayPal · Resend · Web Push (VAPID) · GA4+GTM+Meta Pixel.
App real en `src/app` (la carpeta `apps/web` es copia stale, NO se deploya).

## Estado por área (auditado)

| Área | Estado real | Fuente |
|------|-------------|--------|
| **SEO / indexación** | Gate ≥5 productos implementado, sitemap filtrado, offers/deals noindex, guías de compra reales, ISR en categorías. | `docs/seo-audit-madsjeez.md` |
| **Geolocalización** | PostGIS + seller_locations + RLS + vista pública + nearby RPC + API. UI de mapas pendiente (necesita claves Google). | `docs/madsjeez-geolocalizacion-auditoria.md` |
| **Importación** | CSV/Excel (5 plataformas) + conexión directa OAuth (TiendaNube/Shopify/Woo). | `src/lib/import`, `src/lib/integrations` |
| **Búsqueda** | pg_trgm + ILIKE + unaccent, ranking. Sin modelo de marcas, sin sinónimos, sin consolidación de categorías duplicadas. | Agente 2 |
| **Catálogo** | 737 productos, 492 categorías (114 con productos, 29 INDEX). Categorías MeLi duplicadas. | Agente 2 |
| **Retención** | Favoritos ✅, recomendaciones IA ✅, web push ✅ (pero inseguro→fixed). Follows/saved-searches/alertas = stubs. | Agente 7 |
| **Analytics** | GA4+GTM+Meta+Search Console ✅. Faltan ~9 eventos (category/seller/search/filter/favorite/share/map). | Agente 11 |
| **Seguridad** | RLS sólido (89 tablas), secretos OK, privacidad geo OK, uploads OK, webhooks HMAC OK. **CRÍTICO: push/send sin auth, 7 rutas Gemini sin auth/rate-limit.** | Agente 12 |
| **Merchant feed** | No existe. | Agente 3 (pendiente) |
| **Compatibilidades** | No existe. | Agente 9 (pendiente) |

## Fase 1 — Correcciones críticas (EN CURSO)
1. ✅ **SEGURIDAD CRÍTICA** (Agente 12): `push/send` ahora exige secreto interno + userId obligatorio (no blast a todos). `push/subscribe` deriva userId de sesión. 7 rutas Gemini con rate-limit (+ auth las 6 de seller). 2 rutas geo con rate-limit por IP.
2. ✅ SEO: "Cargando" / categorías vacías / offers vacías → ya resuelto (gate + noindex).
3. ⏳ Consolidar categorías duplicadas (Agente 2) — requiere decisión de taxonomía.
4. ⏳ Eventos de analytics faltantes (Agente 11) — safe, sin credenciales.

## Oleadas siguientes (sin credenciales externas)
- **Wave A (datos/SEO):** consolidación de categorías duplicadas, eventos analytics, schema por vendedor.
- **Wave B (growth):** alertas de precio/stock + tiendas seguidas + búsquedas guardadas (modelos + API + UI). Referral UI (data layer ya existe).
- **Wave C (catálogo):** modelo de compatibilidades + buscador "¿para qué máquina?". Modelo de marcas.
- **Wave D (merchant):** feed Google Shopping (XML) desde productos reales + panel de diagnóstico.

## Bloqueado por credenciales (ver docs/PENDING_CREDENTIALS.md)
- UI de mapas (Google Maps API keys).
- Conexión directa TiendaNube (partner app).
- Mercado Libre sync (ya existe OAuth, oculto por decisión producto).

## Reglas de coordinación aplicadas
- App real `src/app` (no tocar `apps/web`).
- Migraciones por `apply_migration` (numeradas, reversibles donde se puede).
- Cambios riesgosos detrás de feature flags (`src/lib/feature-flags.ts` — pendiente).
- Cada commit: typecheck de archivos nuevos limpio antes de pushear.
