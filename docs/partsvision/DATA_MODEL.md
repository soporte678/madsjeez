# PartsVision — Modelo de datos (Fase 1, aplicado)

Todas las tablas con prefijo `pv_`. RLS activado. Lectura pública solo de
contenido publicado/aprobado; documentos fuente son privados (service role).

## Catálogo de máquinas
- **pv_brands** — marcas (priority 1/2/3). Lectura pública si `active`.
- **pv_machine_types** — tipos jerárquicos (desmalezadora, motosierra, generador…).
- **pv_machine_families** — familias por marca+tipo.
- **pv_machine_models** — modelos. `status` draft→current/discontinued/legacy/unknown.
  `engine_cc`, `power_hp/kw`, `engine_model`, `verified`. Lectura pública si `status<>'draft'`.
- **pv_model_variants** — variantes/revisiones, rango de serie/año, product_number.
- **pv_assemblies** — conjuntos (motor, carburador, embrague, encendido…), jerárquicos.

## Piezas
- **pv_technical_parts** — pieza TÉCNICA (no comercial). `status` workflow de revisión.
  `specifications` jsonb. Lectura pública solo si `published`.
- **pv_oem_part_numbers** — códigos OEM por pieza+marca, supersession.
- **pv_part_fitments** — qué pieza va en qué modelo/variante/conjunto.
  `callout_number`, `quantity_per_machine`, **semáforo** `compatibility_status`
  + `compatibility_confidence` + `verification_status`. Lectura pública solo de
  fitments aprobados o con claim de fuente.
- **pv_part_dimensions** — medidas (diámetro, rosca, estrías, eslabones…), `verified`.

## Proveniencia (PRIVADA — clave de la regla "no inventar")
- **pv_source_documents** — documento fuente: tipo (official/distributor/third_party/
  seller/internal/pending), URL/archivo, `copyright_status`, `permission_status`,
  checksum, fecha de consulta. **Sin lectura pública.**
- **pv_part_sources** — evidencia de un dato de pieza (page, section, evidence_text, confidence).
- **pv_compatibility_sources** — evidencia de un fitment.

## Visualización
- **pv_diagrams** — despiece/foto/esquema. `publication_status`, `copyright_status`,
  `original_document_id`. Lectura pública solo `published`.
- **pv_diagram_hotspots** — puntos/rect/polígono sobre el diagrama → pieza + fitment.
- **pv_three_d_models** / **pv_three_d_nodes** — GLB + nodos mapeados a piezas
  (posición default/exploded, grupos de visibilidad).

## Marketplace (puente)
- **pv_product_part_links** — vincula `products.id` (publicación comercial real) con
  `pv_technical_parts` + `fitment`. `compatibility_claim` (original/alternative/used/
  seller_claimed), `link_status`, `verification_status`. Lectura pública solo aprobados.
  → Varias publicaciones pueden apuntar a la misma pieza técnica.

## Flags
- **feature_flags** — `partsvision_*` (todos OFF). Lectura pública.

## Tipos de estado (resumen)
- Pieza/diagrama: draft → pending_review → approved → published → rejected/archived.
- Fitment/link: pending → approved/rejected.
- Compatibilidad (semáforo): verified · manufacturer_claimed · seller_claimed ·
  inferred · pending · incompatible.
