# PartsVision — Política de fuentes y copyright

## Principio
Ningún dato técnico (modelo, OEM, compatibilidad, medida, diagrama) se publica
sin una **fuente registrada** y un **estado de revisión**. No se inventan datos.

## Clasificación de fuentes (`pv_source_documents.source_type`)
- `official` — fabricante (catálogo IPL, manual de taller oficial).
- `authorized_distributor` — distribuidor autorizado.
- `trusted_third_party` — tercero confiable (verificado).
- `seller_provided` — documento aportado por un vendedor.
- `internal` — documento interno de Madsjeez.
- `pending` — sin verificar (no se publica el contenido derivado).

## Copyright (`copyright_status` + `permission_status`)
- No se copian imágenes/diagramas/bases completas de sitios externos sin verificar derechos.
- No se hace scraping masivo contra términos de servicio.
- Plataformas como Jack's Small Engines, PartsTree, ECHO/Husqvarna/Honda/STIHL
  IPL se usan **como referencia para descubrir estructura de modelos**, NO para
  copiar imágenes/diagramas protegidos.
- Un diagrama solo pasa a `published` si su `copyright_status` ∈ {owned, licensed,
  public_domain} o `permission_status='granted'`. Caso contrario queda en `draft`/`pending_review`.

## Flujo de carga
1. Subir documento → `pv_source_documents` (con URL/archivo, fecha de consulta, checksum).
2. Cargar piezas/fitments en `draft`/`pending`, vinculando evidencia (`pv_part_sources`/`pv_compatibility_sources`).
3. Revisión administrativa (technical_editor/reviewer).
4. Aprobar → `approved`/`published` (solo si la fuente lo permite).

## IA
La IA **puede sugerir** marca/modelo/pieza/medida, pero **no decide** compatibilidad
por sí sola. Toda compatibilidad pasa por reglas + validación humana. Texto OCR/IA
se guarda con su fuente; nunca se publica automáticamente.

## Documentos privados
`pv_source_documents`, `pv_part_sources`, `pv_compatibility_sources` **no tienen
lectura pública** (RLS): pueden contener material con copyright o aportes privados
de vendedores. Solo accesibles por el backend (service role) y el panel admin.
