# PartsVision — Decisiones de arquitectura

## AD-1: Prefijo de tabla `pv_`
Todas las tablas del subsistema usan prefijo `pv_`. Aísla PartsVision del
marketplace, facilita RLS scoping, backups y eventual rollback sin tocar el
catálogo comercial existente.

## AD-2: Pieza técnica ≠ publicación comercial
`pv_technical_parts` (la pieza canónica con OEM/medidas) es independiente de
`products` (la publicación de un vendedor con precio/stock). Se vinculan vía
`pv_product_part_links`. Una pieza técnica → N publicaciones. Esto permite
comparar vendedores sobre la misma pieza y mantener el dato técnico limpio.

## AD-3: Proveniencia obligatoria y privada
Todo dato técnico referencia una fuente (`pv_source_documents`). Las tablas de
fuente/evidencia no tienen lectura pública (copyright + aportes privados).

## AD-4: Despliegue gradual por feature flags
`feature_flags` (tabla) controla la visibilidad. Todo arranca OFF. El sector
público no se muestra hasta que `partsvision_enabled=true` Y haya contenido
publicado. Evita exponer páginas vacías (regla SEO).

## AD-5: Reutilizar PostGIS existente
La búsqueda "vendedores cercanos con el repuesto" reutiliza el sistema geo ya
implementado (`seller_locations` + `nearby_*` RPC). No se duplica.

## AD-6: Compatibilidad con semáforo, no booleana
`compatibility_status` (6 estados) + `confidence` + `verification_status`. Una
publicación pendiente NUNCA muestra "compatibilidad verificada". La IA puede
proponer `inferred`, nunca `verified`.

## AD-7: IDs
`pv_*` usa uuid. El puente a marketplace usa `products.id`/`seller_id` que son
text (cuid), respetando el tipo real de esas tablas.
