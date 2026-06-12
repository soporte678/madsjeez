# PartsVision — Arquitectura SEO

Rutas SSR por máquina/modelo/pieza, con **gate de indexación por contenido real**.
Ninguna página vacía se indexa.

## Rutas
| Ruta | Contenido | Indexa si |
|------|-----------|-----------|
| `/repuestos` | entry point + tipos de máquina | flag ON + ≥1 modelo publicado |
| `/maquinas/[tipo]` | modelos de un tipo (desmalezadora, motosierra…) | flag ON + ≥1 modelo |
| `/modelos/[marca]/[modelo]` | modelo: conjuntos + despieces publicados | flag ON + ≥1 despiece publicado |
| `/despieces/[id]` | visor 2D del despiece | flag ON + diagrama `published` |
| `/pieza/[oem]` | pieza por código OEM: vendedores + compatibilidades | flag ON + pieza `published` |

(Pendientes de fase: `/marcas/[marca]`, `/despieces/[marca]/[modelo]/[conjunto]`,
`/compatibilidad/[pieza]/[modelo]` — mismo patrón.)

## Reglas aplicadas
- **noindex,follow** automático cuando: PartsVision apagado, o la página no tiene
  contenido publicado suficiente. Evita el index bloat de catálogo vacío.
- **Solo contenido publicado/aprobado** se renderiza (RLS + filtros `status`).
- `notFound()` (404) si PartsVision está apagado o el recurso no existe/no publicado.

## Datos estructurados
- `BreadcrumbList` en tipo/modelo.
- (A agregar cuando haya datos) `Product`/`Offer` en `/pieza/[oem]` solo cuando
  hay publicaciones reales — nunca precio técnico ficticio.

## Sitemap
`/sitemap.xml` incluye `/repuestos`, `/maquinas/*`, `/modelos/*`, `/despieces/*`
**solo si** el flag `partsvision_seo_enabled` está ON. Se filtra a modelos no-draft
y diagramas `published`. Si el flag está off, PartsVision no aparece en el sitemap.

## Enlazado interno
repuestos → tipo → modelo → despiece → pieza → producto. Y pieza/OEM → modelos
compatibles. Todo con anchors descriptivos.

## Activación
1. Cargar contenido real (admin) y publicarlo.
2. Prender `partsvision_enabled` (visibilidad pública).
3. Prender `partsvision_seo_enabled` (entra al sitemap).
