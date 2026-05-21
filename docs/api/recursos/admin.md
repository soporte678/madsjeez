# Recurso: Administración

Rutas sensibles: muchas exigen **secretos** o **rol admin** y varias están **bloqueadas en producción** salvo flags explícitos.

## Auth admin (Supabase)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/auth/sign-in` | Login admin |
| POST | `/api/admin/auth/sign-out` | Logout admin |

## Bootstrap y seeds

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/setup` | Crear **primer** admin. Requiere `ADMIN_SETUP_SECRET`. Si `NODE_ENV=production`, también `ENABLE_ADMIN_BOOTSTRAP=true`. |
| POST | `/api/admin/create-direct` | Creación directa controlada por secretos (ver código). |
| POST | `/api/admin/seed-categories` | Poblar categorías (solo entornos autorizados). |
| GET, POST | `/api/admin/seed-reputation` | Seed de niveles de reputación. |
| POST | `/api/admin/login-alert` | Alertas de login (según implementación). |

## Archivo de política

Ver `src/lib/admin-bootstrap.ts`: en **producción** los endpoints de bootstrap responden **403** si no se habilita explícitamente.
