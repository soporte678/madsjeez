# Introducción y convenciones

## Formato

- **Request / response:** `Content-Type: application/json` salvo que el endpoint indique otro (p. ej. redirecciones OAuth).
- **Charset:** UTF-8.
- **Fechas:** cuando aparecen como string, suelen estar en **ISO 8601** (`2026-05-13T12:00:00.000Z`).

## Autenticación

| Tipo | Uso | Cómo se envía |
|------|-----|----------------|
| **Sesión NextAuth** | Usuario o vendedor logueado con Google (u otro proveedor configurado) | Cookie de sesión del navegador (`fetch` con `credentials: "include"` desde el mismo sitio) |
| **Sin sesión** | Catálogo público, health, algunas búsquedas, webhooks | Sin cabecera especial; webhooks pueden validar firma o query según integración |
| **Admin (Supabase)** | Panel admin y rutas `/api/admin/*` según implementación | Credenciales de servicio o flujo propio documentado en cada recurso |
| **Secretos de entorno** | Bootstrap admin, seeds, algunos POST internos | Cuerpo o cabecera con `secret` / `secretKey` según ruta |

No hay **API key pública** estilo `Authorization: Bearer` para el marketplace completo: el modelo principal es **cookie de sesión** en el mismo dominio que sirve Next.js.

## Parámetros de ruta

Los segmentos dinámicos de Next.js se documentan como `{id}` (equivalente a carpetas `[id]` en el código).

Ejemplo: `GET /api/products/{id}` → en repo: `src/app/api/products/[id]/route.ts`.

## Query string

Los query params se documentan en cada recurso cuando son estables (ej. `?analyze=1` en snapshot de ads). Si no figuran, asumí que el endpoint usa **solo** el cuerpo JSON o no acepta query.

## Paginación

Si un listado soporta paginación, suele usar `limit`, `offset` o `page` / `cursor` según el handler concreto. Revisá el código del `GET` correspondiente o los tipos devueltos en la respuesta.

## Idempotencia

- **Webhooks** (Mercado Pago, Meta): deben ser **idempotentes** en el servidor receptor; Mercado Pago puede reintentar notificaciones.
- **Checkout / órdenes:** evitá doble submit en el cliente; el servidor puede devolver `409` si detecta duplicado según regla de negocio.

## Versionado

Hoy **no** hay prefijo `/api/v1/`. Un cambio incompatible implica coordinación con frontends o clientes. Para evolucionar sin romper, se recomienda a futuro introducir `/api/v2/...` solo en recursos nuevos.

## CORS

Las rutas `/api/*` están pensadas principalmente para el **mismo origen** que la app Next. Si necesitás consumir desde otro dominio, habrá que añadir política CORS explícita (no documentada como habilitada por defecto).

## Funcionalidad lista para producción

Toda feature o endpoint que se publique a producción debe seguir el [checklist de documentación API](./listo-para-produccion.md) (índice maestro, recurso en `docs/api/recursos/`, `.env.example`, errores y deploy cuando aplique).
