# Recurso: Dashboard (panel interno)

Métricas y datos para el **dashboard** de la aplicación (comprador / operador según rol).

## Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/dashboard/summary` | Resumen general (KPIs). | Sesión |
| GET | `/api/dashboard/metrics` | Métricas agregadas. | Sesión |
| GET | `/api/dashboard/live` | Monitor en vivo (ej. ventas del día). | Sesión |
| GET | `/api/dashboard/orders` | Órdenes para vista dashboard. | Sesión |
| GET | `/api/dashboard/compras` | Historial compras. | Sesión |
| GET | `/api/dashboard/products` | Productos en contexto dashboard (filtros avanzados vía query: `sort`, `categoryId`, `f_*`). | Sesión |
| GET | `/api/dashboard/products/filter-options` | Categorías distintas usadas en publicaciones del vendedor (para el modal de filtros). | Sesión |
| POST | `/api/dashboard/products` | Crear desde panel. | Sesión |
| PATCH | `/api/dashboard/products` | Actualizar desde panel. | Sesión |
| DELETE | `/api/dashboard/products` | Eliminar desde panel. | Sesión |
| GET | `/api/dashboard/questions` | Preguntas sobre publicaciones. | Sesión |
| GET | `/api/dashboard/opiniones` | Reseñas / opiniones. | Sesión |
| GET | `/api/dashboard/favoritos` | Favoritos del usuario. | Sesión |
| DELETE | `/api/dashboard/favoritos` | Quitar favoritos (según body). | Sesión |
| GET | `/api/dashboard/faq` | FAQ o contenido de ayuda. | Sesión / público según handler |
| GET, POST, PATCH | `/api/dashboard/support` | Tickets o hilos de soporte. | Sesión |
| GET, POST | `/api/dashboard/support/messages` | Mensajes de soporte. | Sesión |
