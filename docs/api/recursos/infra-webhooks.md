# Recurso: Infraestructura y webhooks

## Salud

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | JSON `{ status, timestamp, service }`. Sin autenticación. |
| HEAD | `/api/health` | Misma ruta para probes que no necesitan cuerpo. |

## Webhook Mercado Pago

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/webhooks/mercadopago` | Notificaciones de pagos / órdenes MP. Validar firma con `MERCADOPAGO_WEBHOOK_SECRET`. |
| GET | `/api/webhooks/mercadopago` | Algunos proveedores usan GET para verificación; ver implementación. |

## Buenas prácticas

1. Responder **rápido** (`200`) y procesar async si el trabajo es largo.  
2. Tratar cada notificación como **idempotente** (reintentos de MP).  
3. Registrar `x-request-id` o `data.id` de MP para trazabilidad.
