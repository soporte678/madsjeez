# Recurso: Pedidos, carrito y checkout

## Carrito

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/cart` | Obtener carrito actual (usuario o guest según implementación). | Sesión o cookie guest |
| POST | `/api/cart` | Añadir ítem / crear línea. | Sesión o guest |
| PATCH | `/api/cart` | Actualizar cantidades u opciones. | Sesión o guest |
| DELETE | `/api/cart` | Vaciar o quitar según body/query. | Sesión o guest |

## Órdenes

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/orders` | Listado de órdenes del comprador (o filtros del handler). | Sesión |
| POST | `/api/orders` | Crear orden desde carrito o checkout. | Sesión |

## Checkout Mercado Pago (marketplace)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/checkout/mp` | Iniciar preferencia / pago checkout marketplace con Mercado Pago. Resuelve envío con Zipnova si está configurado (`ZIPNOVA_*`); si falla la cotización con Zipnova activo, responde **502** `ZIPNOVA_QUOTE_FAILED`. Ver [Zipnova Envíos](./zipnova-envios.md). | Sesión |

## Cotización de envío (Zipnova)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/shipping/zipnova/quote` | Cotización del carrito actual + domicilio (preview checkout). | Sesión |

Detalle, variables de entorno y flujo: [Zipnova Envíos](./zipnova-envios.md).

## Webhook pago

Ver [Infra y webhooks](./infra-webhooks.md) para `/api/webhooks/mercadopago`.
