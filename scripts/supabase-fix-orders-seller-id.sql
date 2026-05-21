-- Ejecutar en Supabase → SQL Editor si checkout devuelve PGRST204 sobre orders.seller_id
-- (y Prisma/migrate no pudo aplicar migraciones por pooler :6543).
-- Idempotente.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID;

CREATE INDEX IF NOT EXISTS idx_orders_seller_id_marketplace ON public.orders (seller_id);

NOTIFY pgrst, 'reload schema';
