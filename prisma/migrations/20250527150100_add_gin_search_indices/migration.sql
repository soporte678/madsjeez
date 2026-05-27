-- =============================================================================
-- MIGRACION: Crear indices GIN para busqueda full-text con pg_trgm
-- TIMESTAMP: 2025-05-27 15:01:00
-- PROYECTO: MADSJEEZ Marketplace
-- DEPENDENCIA: Requiere que la extension pg_trgm este habilitada
--              (ver migracion 20250527150000_enable_pg_trgm)
-- =============================================================================
--
-- CONTEXTO:
--   Estos indices GIN (Generalized Inverted Index) utilizan la clase de
--   operadores gin_trgm_ops para acelerar drasticamente las consultas que
--   usan LIKE/ILIKE con patrones de busqueda (%query%).
--
-- RENDIMIENTO ESPERADO:
--   - Tablas pequenas (< 10k filas): mejora moderada (10x-50x)
--   - Tablas medianas (10k-100k filas): mejora significativa (100x-500x)
--   - Tablas grandes (> 100k filas): mejora extrema (500x-1000x+)
--
-- COSTO:
--   - Tiempo de creacion: proporcional al tamano de la tabla
--   - Espacio en disco: ~20-30% del tamano de los campos indexados
--   - Impacto en escrituras: ligero overhead en INSERT/UPDATE/DELETE
--
-- MANTENIMIENTO:
--   - PostgreSQL mantiene los indices GIN automaticamente
--   - Recomendable ejecutar REINDEX despues de cargas masivas de datos
--
-- USO EN CONSULTAS:
--   SELECT * FROM products WHERE title ILIKE '%auriculares%';
--   SELECT * FROM products WHERE title % 'auricular';  -- similarity search
-- =============================================================================

-- =============================================================================
-- INDICES GIN: Tabla products (productos del marketplace)
-- =============================================================================

-- Indice GIN en title: busqueda principal de productos por nombre
-- Uso tipico: busqueda de productos desde la barra de busqueda del marketplace
CREATE INDEX IF NOT EXISTS idx_product_title_trgm
  ON products USING GIN (title gin_trgm_ops);

-- Indice GIN en description: busqueda en descripciones de productos
-- Uso tipico: busqueda avanzada que incluye contenido de la descripcion
CREATE INDEX IF NOT EXISTS idx_product_description_trgm
  ON products USING GIN (description gin_trgm_ops);

-- Indice GIN en sku: busqueda por codigo de producto (SKU)
-- Uso tipico: busqueda por codigo de barras o SKU interno del vendedor
CREATE INDEX IF NOT EXISTS idx_product_sku_trgm
  ON products USING GIN (sku gin_trgm_ops);

-- =============================================================================
-- INDICES GIN: Tabla categories (categorias de productos)
-- =============================================================================

-- Indice GIN en name: busqueda de categorias por nombre
-- Uso tipico: autocompletado de categorias en filtros y navegacion
CREATE INDEX IF NOT EXISTS idx_category_name_trgm
  ON categories USING GIN (name gin_trgm_ops);

-- Indice GIN en slug: busqueda por slug de categoria
-- Uso tipico: resolucion de URLs amigables y busqueda por identificador
CREATE INDEX IF NOT EXISTS idx_category_slug_trgm
  ON categories USING GIN (slug gin_trgm_ops);

-- =============================================================================
-- INDICES GIN: Tabla faqs (preguntas frecuentes)
-- =============================================================================

-- Indice GIN en question: busqueda en preguntas frecuentes
-- Uso tipico: buscador de ayuda que busca coincidencias en las preguntas
CREATE INDEX IF NOT EXISTS idx_faq_question_trgm
  ON faqs USING GIN (question gin_trgm_ops);

-- Indice GIN en answer: busqueda en respuestas de FAQs
-- Uso tipico: busqueda que incluye el contenido de las respuestas
CREATE INDEX IF NOT EXISTS idx_faq_answer_trgm
  ON faqs USING GIN (answer gin_trgm_ops);

-- =============================================================================
-- VERIFICACION: Listar todos los indices GIN creados por esta migracion
-- =============================================================================
SELECT
  schemaname    AS schema,
  tablename     AS table_name,
  indexname     AS index_name,
  indexdef      AS definition
FROM pg_indexes
WHERE indexname LIKE 'idx_%_trgm'
ORDER BY tablename, indexname;
