# Recurso: Búsqueda

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/search/listings` | Búsqueda de publicaciones (query params según handler). | Público |
| GET | `/api/search/suggestions` | Autocompletado de términos. | Público |
| POST | `/api/search/smart` | Búsqueda “inteligente” (posible uso de IA / ranking). | Público o sesión |
| POST | `/api/search/image` | Búsqueda por imagen (subida o URL según implementación). | Sesión / público según handler |

## Notas

- Revisá límites de tamaño en búsqueda por imagen.
- Los parámetros exactos (`q`, `category`, `page`, etc.) están en `src/app/api/search/*/route.ts`.
