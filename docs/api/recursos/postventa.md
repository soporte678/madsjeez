# Recurso: Postventa — reclamos, envíos, reputación

## Reclamos (claims)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/claims` | Listar reclamos del usuario (comprador/vendedor según query). | Sesión |
| POST | `/api/claims` | Abrir reclamo. | Sesión |
| GET | `/api/claims/{id}` | Detalle con orden, partes, mensajes. | Sesión (parte del reclamo) |
| PUT | `/api/claims/{id}` | Actualizar estado / acciones permitidas. | Sesión |
| POST | `/api/claims/{id}/messages` | Enviar mensaje en el hilo del reclamo. | Sesión |

## Envíos (shipments)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/shipments` | Listar envíos. | Sesión |
| POST | `/api/shipments` | Crear o registrar envío. | Sesión |
| PATCH | `/api/shipments/{id}` | Actualizar tracking / estado. | Sesión |
| POST | `/api/shipments/{id}` | Acciones adicionales (ej. evento). | Sesión |

Cotización externa Zipnova (carrito + checkout MP): ver [Zipnova Envíos](./zipnova-envios.md) — no reemplaza estos endpoints; complementa el cálculo de costo antes del pago.

## Reputación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/reputation` | Datos de reputación (vendedor o global según query). | Público o sesión según handler |
