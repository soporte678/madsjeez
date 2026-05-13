# Recurso: IA (Google / prompts internos)

Todos bajo `/api/ai/*`. Suelen ser **POST** con JSON; requieren claves de servicio configuradas en el host (`GOOGLE_GENERATIVE_AI_API_KEY` u otras según handler).

| Método | Ruta | Uso típico |
|--------|------|------------|
| POST | `/api/ai/auto-reply` | Borrador de respuesta automática |
| POST | `/api/ai/blog` | Generación de contenido blog |
| POST | `/api/ai/compare` | Comparar productos u ofertas |
| POST | `/api/ai/enhance-listing` | Mejorar título/descripción |
| POST | `/api/ai/marketing` | Textos de marketing |
| POST | `/api/ai/notifications` | Sugerencias de notificaciones |
| POST | `/api/ai/recommendations` | Recomendaciones de productos |
| POST | `/api/ai/reviews` | Ayuda con respuestas a reseñas |

## Seguridad

- No envíes datos personales innecesarios.
- Considerá **cuotas** y costos por token en producción.
