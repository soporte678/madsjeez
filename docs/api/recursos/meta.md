# Recurso: Meta (Facebook) y WhatsApp Business

Requiere variables `META_*`, `WHATSAPP_*` en el entorno (ver `.env.example`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET, POST | `/api/meta/webhook` | Verificación (`hub.challenge`) y eventos entrantes de Meta. |
| POST | `/api/meta/whatsapp/connect` | Iniciar o completar conexión WABA. |
| POST | `/api/meta/whatsapp/send` | Enviar mensaje saliente (plantilla o sesión según política Meta). |

## Contrato

- **GET:** validación de webhook con `hub.verify_token` configurable.
- **POST:** cuerpo firmado / JSON según producto Meta; validar siempre origen y firma cuando aplique.
