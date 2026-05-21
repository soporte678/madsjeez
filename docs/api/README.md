# Referencia API — Madsjeez Marketplace

**Documentación interactiva (sitio):** [Abrir `/docs/api`](/docs/api) — misma guía con navegación lateral estilo portal de desarrolladores.

Documentación orientada a **desarrolladores**, en el espíritu de los portales tipo Mercado Libre Developers: recursos agrupados por dominio, métodos HTTP, autenticación y convenciones de respuesta.

> **Base URL:** `{NEXT_PUBLIC_APP_URL}` en producción (ej. `https://www.madsjeez.com.ar`). En local: `http://localhost:3000`.  
> **Prefijo API:** todas las rutas documentadas viven bajo `/api/...`.

## Contenido

| Documento | Contenido |
|-----------|-----------|
| [Introducción y convenciones](./introduccion.md) | URL, JSON, cookies de sesión, idempotencia, versionado |
| [Listo para producción (requisitos doc)](./listo-para-produccion.md) | Checklist: índice, recurso, `.env.example`, errores, deploy |
| [Errores y códigos HTTP](./errores.md) | Patrones `4xx` / `5xx`, cuerpo de error típico |
| [Índice maestro (tabla)](./indice-maestro.md) | Listado de handlers con métodos (actualizar al agregar rutas) |
| [Autenticación](./recursos/autenticacion.md) | NextAuth, registro, usuario actual |
| [Productos y catálogo](./recursos/productos.md) | CRUD, variaciones, mayorista, carrusel |
| [Pedidos, carrito y checkout](./recursos/pedidos-checkout.md) | Órdenes, carrito, checkout MP |
| [Zipnova Envíos](./recursos/zipnova-envios.md) | Cotización envío, env vars, checkout MP + metadata orden |
| [Dashboard](./recursos/dashboard.md) | Métricas, productos panel, soporte, favoritos |
| [Reclamos, envíos, reputación](./recursos/postventa.md) | Claims, shipments, reputation |
| [Preguntas y notificaciones](./recursos/comunicacion.md) | Q&A, uploads, notificaciones |
| [Marketing: campañas, cupones, ofertas](./recursos/marketing.md) | Campaigns, coupons, offers |
| [Mercado Libre (integración)](./recursos/mercado-libre.md) | OAuth, import, PADS, promos |
| [Vendedor — Mercado Pago](./recursos/seller-mercadopago.md) | Conexión OAuth vendedor, preferencias |
| [Búsqueda](./recursos/busqueda.md) | Listings, sugerencias, smart, imagen |
| [IA](./recursos/ia.md) | Endpoints bajo `/api/ai/*` |
| [Meta / WhatsApp](./recursos/meta.md) | Webhook, envío, conexión |
| [Administración](./recursos/admin.md) | Bootstrap admin, seeds (entornos controlados) |
| [Webhooks y salud](./recursos/infra-webhooks.md) | Mercado Pago webhook, health |
| [Suscripciones, importación, chat](./recursos/plataforma.md) | Subscriptions, import-products, chat |
| [Prueba / utilidades](./recursos/test.md) | Endpoints solo para desarrollo |

## Código fuente

La implementación vive en `src/app/api/**/route.ts` (App Router de Next.js). Esta documentación **no sustituye** el contrato exacto de cada cuerpo JSON: ante dudas, el código es la fuente de verdad hasta que exista esquema OpenAPI generado automáticamente.

## Mantenimiento

Al agregar o renombrar rutas:

1. Cumplir el [checklist listo para producción](./listo-para-produccion.md) si el cambio se publica a usuarios reales.  
2. Actualizar la tabla en [índice maestro](./indice-maestro.md).  
3. Ajustar el archivo de **recurso** correspondiente bajo `docs/api/recursos/`.
