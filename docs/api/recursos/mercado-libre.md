# Recurso: Mercado Libre (integración)

OAuth de usuario, importación de publicaciones, promociones, notificaciones y **Product Ads (PADS)**.

> Requiere variables `MELI_APP_ID`, `MELI_CLIENT_SECRET`, `MELI_REDIRECT_URI` y usuario con tokens guardados según flujo de la app.

## OAuth

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/meli/oauth/authorize` | Redirige al login ML; inicia OAuth. | Sesión |
| GET | `/api/meli/oauth/callback` | Callback OAuth (código → tokens). | Público (navegador ML) |

## Estado e importación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/meli/status` | Estado y lista de cuentas ML conectadas. | Sesión |
| GET, PATCH, DELETE | `/api/meli/accounts` | Listar, marcar principal o desconectar cuentas. | Sesión |
| GET, POST | `/api/meli/import` | Vista previa o importación (`accountId`, hasta 100 páginas, imágenes en storage). | Sesión |
| POST | `/api/meli/push-items` | Enviar precio, stock, título y fotos hacia ML. | Sesión |
| GET | `/api/meli/local-unpublished` | Listados no publicados en ML. | Sesión |

**Multi-cuenta:** varias cuentas ML por vendedor (`userId` + `meliUserId` único). Parámetro `accountId` en import/push.

**Sync stock:** ventas en Madsjeez empujan stock a ML; webhooks `items` actualizan stock local (ML referencia primaria).

## Promociones ML

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/meli/promotions` | Promociones del vendedor en ML. | Sesión |
| POST | `/api/meli/promotions/sync` | Sincronizar promociones con base local. | Sesión |

## Notificaciones (tópicos ML → tu app)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET, POST | `/api/meli/notifications` | Webhook o verificación según configuración ML Developers. | Según firma / token ML |

## Product Ads (PADS)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/meli/ads/snapshot` | Snapshot de anunciantes, campañas, métricas y análisis. **Query:** `analyze` (`1` activa análisis), `days` (7–90, default 14), `compare_days` (ventana comparación). | Sesión |
| GET | `/api/meli/ads/campaign-items` | Ítems de una campaña. **Query típico:** `siteId`, `advertiserId`, `campaignId`, `days`. | Sesión |
| POST | `/api/meli/ads/apply` | Aplicar acciones sugeridas (payload con lista de acciones). | Sesión |

### Respuesta snapshot (conceptual)

Incluye campos como `advertisers`, campañas, métricas, `rolledTotals`, `dailyHistory`, `comparisons`, `recommendations`, `errors[]`, `fetchedAt`, etc. Ver `src/app/api/meli/ads/snapshot/route.ts` para el shape exacto.
