# Geolocalización Madsjeez — Auditoría e implementación

Fecha: 2026-06-05 · Stack: Next.js 16 (App Router/RSC) · Prisma · Supabase (Postgres) · Railway

## Stack encontrado
- **Frontend/Backend:** Next.js App Router, Server Components + API routes (`src/app/api/*`).
- **DB:** Supabase Postgres. Acceso server con `supabaseService` (service role). RLS en varias tablas.
- **Auth:** NextAuth (Credentials). `session.user.id`, `session.user.isSeller`.
- **Vendedores:** tabla `users` (Prisma) con `isSeller`, `sellerName`, y campos geo gruesos previos: `seller_province(_slug)`, `seller_locality(_slug)`, `seller_partido`, `seller_postal_code`, `seller_lat`, `seller_lng` (sin uso real, 0 poblados).
- **Productos:** tabla `products`, FK `seller_id → users.id`. NO duplican dirección.
- **Flash:** `flash_shipments` (street, city, province, postal_code, driver_id, shipping_tier…). Logística propia ya existente.

## Estado previo a esta implementación
- **PostGIS:** apagado. → habilitado (`extensions`).
- **`seller_locations`:** no existía. → creada.
- **Sellers:** 3, con 0 coordenadas. Catálogo dominado por 1 seller (Vian, ~690 productos en Carlos Spegazzini) + Mellimelos (ropa de bebé).
- Geo previo (province/locality slugs en `users`) sirve para filtros por texto, pero no para distancia/mapa.

## Problemas detectados
1. No había modelo geográfico real (lat/lng, PostGIS, privacidad).
2. Riesgo de exponer domicilios particulares si se publicaba dirección sin gate de privacidad.
3. Búsqueda por proximidad inexistente.

## Lo implementado en esta fase (orden 1-2 del plan: datos + seguridad)
- **PostGIS** habilitado + tabla `seller_locations` (coords privadas, coords públicas, visibilidad, logística, verificación, datos de retiro Flash privados). Índices GIST + por seller/locality/provincia/postal/flags.
- **Privacidad (Fase 5):** función determinista `geo_public_point()` que desplaza la coordenada pública 300–1.5km (approximate) o 2–4km (locality_only), estable por seller, derivada de hash. `exact` no desplaza, `hidden` no expone.
- **RLS + vista segura (Fase 17):** la tabla solo la lee el service role. El público lee `public_seller_locations` (solo campos públicos + coords públicas; `formatted_address` solo si `exact`). Tabla de auditoría `seller_location_audit`.
- **RPC proximidad (Fase 6):** `nearby_sellers()` y `nearby_products()` filtran/ordenan por distancia en PostGIS (`ST_DWithin`/`ST_Distance`), solo con coordenadas públicas. Validadas: offset 895m, vendedor encontrado a 2.2km con conteo real de productos.
- **Upsert seguro:** `upsert_seller_location()` (SECURITY DEFINER) computa coords públicas + audita; solo lo invoca el backend.
- **API:** `GET/PUT /api/seller/location` (dueño edita), `GET /api/geo/nearby-sellers`, `GET /api/geo/nearby-products` (públicos, validan coords y acotan radio/limit).

## Pendiente (fases siguientes — requieren claves de Google)
- **Google Maps Platform** (claves a crear en Google Cloud por el dueño — ver `docs/maps-setup.md`).
- UI: registro de ubicación del vendedor con autocompletado (Fase 4), mapa en perfil/producto (7/8), vista lista+mapa (9), filtros por radio (11), ubicación del comprador (10).
- Integración Flash con dirección privada de retiro (13), panel admin (15), migración de sellers (16), tests (20).

## APIs necesarias
- Google Maps JavaScript API + Places API (New) + Geocoding API (server) + Routes API (solo checkout/cómo-llegar).

## Riesgos y mitigación
- **Exposición de domicilio:** mitigado por coords públicas separadas + vista + RLS + default `approximate`.
- **Costo de Routes API:** se usa solo bajo demanda (no en listados) — Fase 12.
- **Escala:** filtrado geográfico en PostGIS con índice GIST, no en JS.

## Archivos creados/modificados
- DB: migraciones `geo_postgis_seller_locations`, `geo_privacy_rls_view_audit`, `geo_nearby_rpc_functions`, `geo_upsert_seller_location_rpc`.
- API: `src/app/api/seller/location/route.ts`, `src/app/api/geo/nearby-sellers/route.ts`, `src/app/api/geo/nearby-products/route.ts`.
- Env: `.env.example` (3 vars de Maps).
- Docs: este archivo + `maps-setup.md`, `seller-location-model.md`, `location-privacy.md`, `postgis-nearby-search.md`.
