# Recurso: Prueba y desarrollo

## WhatsApp de prueba

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET, POST | `/api/test/whatsapp` | Endpoint para pruebas de integración WhatsApp. | **No usar en producción pública**; proteger o deshabilitar en deploy. |

> Recomendación: en producción, eliminar o restringir por IP / flag de entorno estos endpoints bajo `/api/test/*`.
