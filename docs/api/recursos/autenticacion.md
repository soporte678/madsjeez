# Recurso: Autenticación y usuario

## Descripción

Autenticación de **usuarios finales** (NextAuth) y datos del perfil conectado.

## Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET, POST | `/api/auth/[...nextauth]` | Rutas internas de NextAuth (login OAuth, callback, CSRF, sesión). No llamar manualmente salvo flujos soportados por la librería. | Según flujo |
| POST | `/api/auth/register` | Registro de usuario (email/contraseña u esquema definido en el handler). | Público |
| GET | `/api/user/me` | Perfil del usuario autenticado. | Sesión |
| GET, POST, DELETE | `/api/user/access-key` | Gestión de clave de acceso / API key de usuario si aplica al modelo de negocio. | Sesión |

## Notas

- La **sesión** se refleja en cookies HTTP-only gestionadas por NextAuth.
- Para SPA en el mismo dominio, usá `credentials: "include"` en `fetch`.
