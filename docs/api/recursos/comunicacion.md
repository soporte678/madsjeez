# Recurso: Comunicación — preguntas y notificaciones

## Preguntas (Q&A)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/questions` | Listar preguntas (producto, vendedor, etc.). | Sesión / público según filtros |
| POST | `/api/questions` | Crear pregunta en una publicación. | Sesión |
| PUT | `/api/questions/{id}` | Responder o editar según rol. | Sesión |
| DELETE | `/api/questions/{id}` | Eliminar o moderar. | Sesión |
| POST, DELETE | `/api/questions/upload` | Adjuntos para preguntas (subida / borrado). | Sesión |

## Notificaciones

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/notifications` | Listar notificaciones del usuario. | Sesión |
| PATCH | `/api/notifications` | Marcar leídas / actualizar estado. | Sesión |
| DELETE | `/api/notifications` | Eliminar notificaciones. | Sesión |

## Chat

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/chat` | Obtener mensajes o salas. | Sesión |
| POST | `/api/chat` | Enviar mensaje. | Sesión |
