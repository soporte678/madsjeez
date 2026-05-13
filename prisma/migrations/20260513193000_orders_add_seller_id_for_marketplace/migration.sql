-- Checkout marketplace inserta `seller_id` (UUID perfil Supabase) vía PostgREST.
-- Si falta la columna, PostgREST devuelve PGRST204 ("schema cache").
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "seller_id" TEXT;
