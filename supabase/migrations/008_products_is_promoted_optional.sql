-- Si tu proyecto no tiene estas columnas (error 42703 en búsqueda/listados), ejecutá esto en Supabase SQL Editor.
-- Alinea con supabase/migrations/001_initial_schema.sql

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_promoted
  ON public.products(is_promoted, promoted_until)
  WHERE is_promoted = TRUE;
