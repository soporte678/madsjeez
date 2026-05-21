# Recurso: Zipnova Envíos (cotización y envío post-pago)

Integración con [Zipnova Envíos](https://docs.zipnova.com/envios) para **cotizar** el costo de envío del carrito según destino y, tras un pago aprobado vía Mercado Pago, **crear el envío** cuando la orden trae metadatos de cotización en `shipping_address.zipnova`.

Soporte operativo: [Centro de ayuda Zipnova (es-419)](https://ayuda-envios.zipnova.com/hc/es-419/).

## Estado de implementación

| Capacidad | Estado |
|-----------|--------|
| Cotización en servidor (`POST /shipments/quote` vía API Zipnova) | **Producción** (requiere env configurado) |
| Endpoint interno de preview `POST /api/shipping/zipnova/quote` | **Producción** |
| Uso de cotización en `POST /api/checkout/mp` (monto envío + `zipnova` en `shipping_address`) | **Producción** |
| UI checkout: debounce y totales alineados con cotización | **Producción** |
| OAuth por vendedor (conectar cuenta Zipnova del seller a la app marketplace) | **Producción** — si el vendedor conectó OAuth, cotización y creación de envío usan su cuenta Zipnova (Bearer); si no, se usa Basic del marketplace (`ZIPNOVA_*`) cuando esté configurado |
| Creación de envío en Zipnova post-pago (`POST …/shipments` vía API v2) | **Producción** — al primer pago aprobado, el webhook de Mercado Pago llama a Zipnova con la cotización guardada en `shipping_address.zipnova` y persiste `shipment_id`, tracking y errores de creación en el mismo objeto |

## Variables de entorno

Definidas en `.env.example` con el prefijo `ZIPNOVA_*`. Resumen:

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `ZIPNOVA_API_BASE_URL` | No | Base API v2 (ej. `https://api.zipnova.com.ar/v2`). Si faltan credenciales, el sistema no llama a Zipnova. |
| `ZIPNOVA_ACCOUNT_ID` | Sí (para Zipnova) | ID numérico de cuenta Zipnova. |
| `ZIPNOVA_API_TOKEN` | Sí (para Zipnova) | Usuario HTTP Basic (token API). |
| `ZIPNOVA_API_SECRET` | Sí (para Zipnova) | Contraseña HTTP Basic (secret API). |
| `ZIPNOVA_SOURCE` | No | Identificador de canal (máx. 150 caracteres); default en código: `madsjeez_marketplace`. |
| `ZIPNOVA_ORIGIN_ID` | No | ID de origen en el address book Zipnova; si no se define, usa el default de la cuenta. |
| `ZIPNOVA_OAUTH_CLIENT_ID` | No | Cliente OAuth de la **app marketplace** registrada en Zipnova. |
| `ZIPNOVA_OAUTH_CLIENT_SECRET` | No | Secreto de la app. |
| `ZIPNOVA_OAUTH_REDIRECT_URI` | No | Debe coincidir con el redirect registrado en Zipnova (ej. `https://tu-dominio/api/seller/zipnova/oauth/callback`). |
| `ZIPNOVA_OAUTH_BASE_URL` | No | Host OAuth sin `/v2` (ej. `https://api.zipnova.com.ar`); si falta, se deriva de `ZIPNOVA_API_BASE_URL`. |

Si **no** está configurado el trío `ZIPNOVA_ACCOUNT_ID` + `ZIPNOVA_API_TOKEN` + `ZIPNOVA_API_SECRET` (y `account_id` válido), el costo de envío con ítems que **no** tienen envío gratis usa el **monto fijo legacy** de **2500** (ARS, según `resolveCartShippingCost` en `src/lib/zipnova/quote-cart.ts`).

## OAuth por vendedor (marketplace)

Zipnova documenta OAuth2 para que **cada cuenta Zipnova** autorice a la app del marketplace ([Autorización con OAuth](https://docs.zipnova.com/envios/principios/autorizacion-con-oauth.md)). Eso **no crea** una cuenta Zipnova nueva: enlaza una cuenta **ya existente** del vendedor.

| Ruta | Método | Rol |
|------|--------|-----|
| `/api/seller/zipnova/oauth/start` | GET | Sesión vendedor; redirección a Zipnova authorize; cookie `zipnova_oauth_state`. |
| `/api/seller/zipnova/oauth/callback` | GET | Intercambia `code` por tokens; `upsert` en `SellerZipnovaOAuth` (Prisma). |
| `/api/seller/zipnova/status` | GET | JSON: `oauthAppConfigured`, `connected`, `expiresAt`, etc. Solo vendedores. |

Variables: `ZIPNOVA_OAUTH_*` en `.env.example`. UI: enlace **Conectar Zipnova** en `/dashboard/publicaciones` cuando la app OAuth está configurada y el vendedor aún no conectó.

**Nota:** el login con Google/Facebook en Madsjeez es independiente; no hay en la documentación pública de Zipnova un flujo para **provisionar** cuenta Zipnova desde esas identidades. El vendedor debe tener (o crear) cuenta en Zipnova y luego autorizar OAuth.

## Endpoints propios (Madsjeez)

### `POST /api/shipping/zipnova/quote`

Cotiza el envío del **carrito Prisma** del usuario autenticado y un domicilio de destino (preview antes de pagar).

| Aspecto | Detalle |
|---------|---------|
| **Auth** | Sesión NextAuth (`credentials: "include"`). |
| **Body JSON** | `{ "shipping": { "city", "state", "zip", "street", "number" } }` — campos string; los vacíos se envían como cotización débil; conviene enviar dirección completa para resultados fiables. |
| **Éxito 200** | `{ "shipping_full": number, "buyer_shipping_share": number, "used_zipnova": boolean, "zipnova": object \| null }` — `zipnova` es metadata de la opción elegida cuando `used_zipnova === true`. |
| **401** | Sin sesión. |
| **400** | Carrito vacío. |
| **502** | Fallo de cotización (Zipnova, red, dirección sin opciones, etc.); `error` con mensaje legible. |

Implementación: `src/app/api/shipping/zipnova/quote/route.ts`.

### `POST /api/checkout/mp`

Inicio de pago marketplace Mercado Pago. Incluye resolución de envío con la misma lógica que la cotización (carrito + fragmento de dirección para quote). Cuando el pago queda **aprobado**, el webhook `POST /api/webhooks/mercadopago` intenta **crear el envío** en Zipnova (ver más abajo).

| Aspecto | Detalle |
|---------|---------|
| **Auth** | Sesión + perfil comprador en Supabase. |
| **Body** | Incluye `shipping` (objeto domicilio); ver `src/app/api/checkout/mp/route.ts`. |
| **Envío** | Si Zipnova está configurado y hay ítems con envío pago, se cotiza; si falla: **502** con `code: "ZIPNOVA_QUOTE_FAILED"`. |
| **Persistencia** | En inserción de orden, `shipping_address` incluye `zipnova` con metadatos de cotización. Tras pago, el mismo objeto puede sumar `shipment_id`, `carrier_tracking_id`, `tracking` o `shipment_create_error` si la creación falla. |

Documentación general del checkout: [Pedidos, carrito y checkout](./pedidos-checkout.md).

### Webhook Mercado Pago → creación de envío Zipnova

En `POST /api/webhooks/mercadopago`, cuando el pago pasa a **aprobado** por primera vez (`paid_at` en `seller_fulfillment`), después de fusionar esa marca en `shipping_address` se invoca `tryCreateZipnovaShipmentForPaidOrder` (`src/lib/zipnova/create-shipment.ts`):

- Requisitos: orden persistida (no `tmp_*`), `order_items` en Supabase enlazados a productos Prisma, cotización previa en `shipping_address.zipnova` sin `shipment_id`, credenciales Zipnova (OAuth del vendedor o Basic del marketplace), email de destino (`guest_claim` / checkout).
- Éxito: se guardan `shipment_id`, `shipment_external_id`, `shipment_created_at`, `carrier_tracking_id`, `tracking` dentro de `zipnova`.
- Fallo: no se revierte el pago; se guardan `shipment_create_failed_at` y `shipment_create_error` para diagnóstico.

Referencia API Zipnova: [Crear envíos](https://docs.zipnova.com/envios/recursos-api/envios/crear-envios.md).

## Código relacionado

| Ruta / módulo | Rol |
|---------------|-----|
| `src/lib/zipnova/config.ts` | Lectura de env y cabecera Basic Auth. |
| `src/lib/zipnova/quote-cart.ts` | Armado de ítems, llamada a quote Zipnova, selección de opción, `resolveCartShippingCost`, `resolveZipnovaQuoteConnection`. |
| `src/lib/zipnova/create-shipment.ts` | Tras pago MP: `POST …/shipments` con cotización persistida; merge de resultado en `shipping_address.zipnova`. |
| `src/app/api/webhooks/mercadopago/route.ts` | Webhook MP: al marcar `paid_at`, intenta crear envío Zipnova. |
| `src/app/checkout/page.tsx` | Cliente: cotización con debounce al endpoint quote. |

## Contrato externo Zipnova

Los paths y esquemas exactos de la API Zipnova son responsabilidad del proveedor. Referencia oficial: [Documentación Zipnova Envíos](https://docs.zipnova.com/envios).
