# Recurso: Productos y catálogo

Incluye publicaciones, detalle, listados del vendedor, mayorista y carrusel.

## Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/products` | Listado / búsqueda de productos (query según implementación). | Público / opcional sesión |
| POST | `/api/products` | Crear producto. | Sesión (vendedor) |
| GET | `/api/products/{id}` | Detalle con imágenes, categoría, vendedor, reseñas recientes. | Público |
| PUT | `/api/products/{id}` | Actualizar producto. | Propietario / rol |
| DELETE | `/api/products/{id}` | Eliminar o desactivar según lógica. | Propietario / rol |
| GET | `/api/products/carousel` | Datos para carrusel home / destacados. | Público |
| GET | `/api/products/my` | Productos del vendedor autenticado. | Sesión vendedor |
| GET, POST, DELETE | `/api/products/wholesale` | Flujo mayorista (listar, agregar, quitar). | Según handler |
| GET, POST | `/api/variations` | Listar o crear variaciones. | Sesión |
| PUT, DELETE | `/api/variations/{id}` | Actualizar o borrar variación. | Sesión |
| GET | `/api/categories` | Árbol o listado de categorías. | Público |

## Errores frecuentes

- **401** en `my` o mutaciones sin sesión.
- **404** si el `id` no existe o no está publicado.
