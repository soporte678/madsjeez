-- Alinear `public.orders` con checkout marketplace (PostgREST).
-- Idempotente: no falla si la columna ya existe.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_seller_id_marketplace ON public.orders (seller_id);
