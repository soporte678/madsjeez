# Recurso: Zipnova Envíos (cotización marketplace)

Integración con [Zipnova Envíos](https://docs.zipnova.com/envios) para **cotizar** el costo de envío del carrito según destino. La cotización elegida (metadatos mínimos) puede persistirse en la orden al hacer checkout con Mercado Pago.

Soporte operativo: [Centro de ayuda Zipnova (es-419)](https://ayuda-envios.zipnova.com/hc/es-419/).

## Estado de implementación

| Capacidad | Estado |
|-----------|--------|
| Cotización en servidor (`POST /shipments/quote` vía API Zipnova) | **Producción** (requiere env configurado) |
| Endpoint interno de preview `POST /api/shipping/zipnova/quote` | **Producción** |
| Uso de cotización en `POST /api/checkout/mp` (monto envío + `zipnova` en `shipping_address`) | **Producción** |
| UI checkout: debounce y totales alineados con cotización | **Producción** |
| Creación de envío en Zipnova post-pago (`POST /v2/shipments` o equivalente) | **No implementado** — documentar cuando exista handler/job |

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

Si **no** está configurado el trío `ZIPNOVA_ACCOUNT_ID` + `ZIPNOVA_API_TOKEN` + `ZIPNOVA_API_SECRET` (y `account_id` válido), el costo de envío con ítems que **no** tienen envío gratis usa el **monto fijo legacy** de **2500** (ARS, según `resolveCartShippingCost` en `src/lib/zipnova/quote-cart.ts`).

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

Inicio de pago marketplace Mercado Pago. Incluye resolución de envío con la misma lógica que la cotización (carrito + fragmento de dirección para quote).

| Aspecto | Detalle |
|---------|---------|
| **Auth** | Sesión + perfil comprador en Supabase. |
| **Body** | Incluye `shipping` (objeto domicilio); ver `src/app/api/checkout/mp/route.ts`. |
| **Envío** | Si Zipnova está configurado y hay ítems con envío pago, se cotiza; si falla: **502** con `code: "ZIPNOVA_QUOTE_FAILED"`. |
| **Persistencia** | En inserción de orden, `shipping_address` puede incluir clave `zipnova` con metadatos de cotización (`quoted_at`, `logistic_type`, `service_type_code`, `carrier_id`, `point_id`, importes, etc.) para trazabilidad y futura creación de envío. |

Documentación general del checkout: [Pedidos, carrito y checkout](./pedidos-checkout.md).

## Código relacionado

| Ruta / módulo | Rol |
|---------------|-----|
| `src/lib/zipnova/config.ts` | Lectura de env y cabecera Basic Auth. |
| `src/lib/zipnova/quote-cart.ts` | Armado de ítems, llamada a quote Zipnova, selección de opción, `resolveCartShippingCost`. |
| `src/app/checkout/page.tsx` | Cliente: cotización con debounce al endpoint quote. |

## Contrato externo Zipnova

Los paths y esquemas exactos de la API Zipnova son responsabilidad del proveedor. Referencia oficial: [Documentación Zipnova Envíos](https://docs.zipnova.com/envios).
