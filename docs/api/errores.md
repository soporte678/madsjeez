# Errores y códigos HTTP

Patrón general usado en los handlers de Next.js (`NextResponse.json`).

## Cuerpo típico de error

```json
{
  "error": "Mensaje legible para humanos",
  "details": "Información adicional opcional"
}
```

Algunos endpoints devuelven campos extra (`code`, `issues`, etc.) según validación con Zod u origen del fallo.

## Códigos comunes

| Código | Significado habitual |
|--------|----------------------|
| **400** | Parámetros inválidos, JSON mal formado, validación fallida |
| **401** | No hay sesión o token inválido para recurso protegido |
| **403** | Sesión válida pero sin permiso (rol, recurso de otro usuario, bootstrap deshabilitado en prod) |
| **404** | Recurso inexistente o no visible para el actor actual |
| **409** | Conflicto de negocio (ej. admin ya creado, duplicado) |
| **500** | Error interno no controlado |

## Errores de integraciones externas

- **Mercado Libre / Mercado Pago:** el mensaje puede incluir texto de la API externa o un resumen interno. Revisá también `errors[]` en respuestas de snapshot si aplica.
- **Zipnova Envíos:** cotización o checkout con Zipnova configurado puede responder **502** con cuerpo `{ "error": "...", "code": "ZIPNOVA_QUOTE_FAILED" }` en `POST /api/checkout/mp`, o solo `error` en `POST /api/shipping/zipnova/quote`. Detalle en [Zipnova Envíos](./recursos/zipnova-envios.md).

## Rate limiting

En la versión actual del código **no** hay un middleware global documentado de rate limiting por IP. Para producción pública se recomienda capa externa (CDN, API gateway) o implementación por ruta.
