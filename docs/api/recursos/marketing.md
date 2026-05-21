# Recurso: Marketing — campañas, cupones, ofertas

## Campañas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/campaigns` | Listar campañas del vendedor. | Sesión vendedor |
| POST | `/api/campaigns` | Crear campaña. | Sesión vendedor |
| GET | `/api/campaigns/{id}` | Detalle con productos vinculados. | Sesión vendedor (dueño) |
| PATCH | `/api/campaigns/{id}` | Actualizar campaña. | Sesión vendedor |
| DELETE | `/api/campaigns/{id}` | Eliminar campaña. | Sesión vendedor |

## Cupones

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET, POST | `/api/coupons` | Listar / crear cupones (panel). | Sesión |
| GET | `/api/coupons/public` | Validar o listar cupones aplicables en checkout público. | Público |

## Ofertas

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/offers` | Ofertas activas / landing. | Público |

## Boost vendedor

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST, PUT | `/api/seller/boost` | Configurar o actualizar boost de publicaciones. | Sesión vendedor |
