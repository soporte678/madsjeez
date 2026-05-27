-- =============================================================================
-- MIGRACION: Habilitar extension pg_trgm para busqueda full-text con trigramas
-- TIMESTAMP: 2025-05-27 15:00:00
-- PROYECTO: MADSJEEZ Marketplace
-- =============================================================================
--
-- CONTEXTO:
--   Las busquedas actuales usan ILIKE '%query%' lo que fuerza FULL TABLE SCAN.
--   La extension pg_trgm permite crear indices GIN que aceleran las busquedas
--   de texto con operadores LIKE/ILIKE hasta 1000x en tablas grandes.
--
-- NOTA SOBRE SUPABASE:
--   En Supabase, pg_trgm puede requerir habilitacion manual desde el dashboard:
--   Database -> Extensions -> pg_trgm -> Enable
--   Si esta migracion falla por permisos, habilitarla manualmente y re-ejecutar.
--   La instruccion IF NOT EXISTS evita errores si ya esta habilitada.
--
-- DOCUMENTACION:
--   https://www.postgresql.org/docs/current/pgtrgm.html
-- =============================================================================

-- Habilitar extension pg_trgm para busqueda full-text con trigramas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Verificar que la extension se instalo correctamente
SELECT
  extname   AS extension_name,
  extowner  AS owner_id,
  extnamespace AS schema_id,
  extversion   AS version
FROM pg_extension
WHERE extname = 'pg_trgm';
