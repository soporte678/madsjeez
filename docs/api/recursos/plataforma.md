# Recurso: Plataforma — suscripciones, importación, suscripción genérica

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST, GET | `/api/subscriptions` | Planes de suscripción del usuario/vendedor (crear o consultar). | Sesión |
| POST | `/api/import-products` | Importación masiva (CSV/Excel según handler). | Sesión vendedor / admin |

## Importación

El cuerpo y formato aceptado dependen de `src/app/api/import-products/route.ts` (campos, validaciones, límites).
