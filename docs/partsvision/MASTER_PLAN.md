# Madsjeez PartsVision — Master Plan

Catálogo técnico de repuestos con despieces interactivos, compatibilidades y
conexión a publicaciones de vendedores. "Explorá tu máquina, identificá la pieza
y encontrá quién la vende."

## Regla rectora
**Nada de datos técnicos se inventa.** Modelos, OEM, compatibilidades, medidas,
diagramas: todo guarda fuente + estado + nivel de confianza, y queda en estado
`pending`/`draft` hasta validación. El sistema (schema, admin, visores) se
construye vacío y se llena solo con fuentes autorizadas.

## Stack (auditoría)
- Next.js 16 (App Router/RSC) · Prisma · Supabase Postgres · Railway.
- Marketplace existente: `products` (id text), `users` (id text/cuid, `isSeller`),
  categorías, geo (PostGIS `seller_locations`), motor de compatibilidades simple
  ya existente (`compatibility_machines`/`compatibility_links` — precursor).
- PartsVision se aísla con prefijo de tabla `pv_` y feature flags. **No toca el
  marketplace actual.**

## Fases
| Fase | Contenido | Estado |
|------|-----------|--------|
| 1 | Base de datos (entidades, fuentes, compatibilidades, RLS, flags) | ✅ Migraciones aplicadas |
| 2 | Visor 2D + editor de hotspots (admin) | ⏳ |
| 3 | Marketplace: vincular piezas ↔ productos, comparar vendedores | ⏳ (tabla `pv_product_part_links` lista) |
| 4 | SEO: rutas /repuestos /despieces /modelos /pieza/[oem] | ⏳ |
| 5 | Diagnóstico por síntomas | ⏳ |
| 6 | Visor 3D (GLB) | ⏳ |
| 7 | IA / búsqueda por fotografía | ⏳ |

Despliegue gradual con feature flags (todos OFF por defecto).

## Entregado en Fase 1
- 18 tablas `pv_*` + `feature_flags`, con índices y RLS.
- Separación pieza técnica (`pv_technical_parts`) vs publicación comercial
  (`products` ↔ `pv_product_part_links`).
- Proveniencia: `pv_source_documents` + `pv_part_sources` + `pv_compatibility_sources`
  (privadas, solo service role — pueden tener copyright).
- Semáforo de compatibilidad: `compatibility_status` (verified/manufacturer_claimed/
  seller_claimed/inferred/pending/incompatible) + `compatibility_confidence`.
- `src/lib/partsvision/feature-flags.ts` (lectura cacheada de flags).
- Docs: este plan + DATA_MODEL + SOURCE_POLICY + ARCHITECTURE_DECISIONS.

## Próximo paso recomendado
Fase 2 (admin + visor 2D) **o** validar la lista MVP de modelos (`MVP_MODELS.md`)
y conseguir 1 fuente autorizada (catálogo IPL / manual) para cargar el primer
despiece real. Sin fuente, el catálogo queda vacío por diseño.
