import type { PrismaClient } from "@prisma/client";

/**
 * Fuerza a PostgREST a recargar el esquema (útil tras `ALTER TABLE` si aparece PGRST204
 * "column ... not found in the schema cache"). Requiere que Prisma use la misma DB que Supabase.
 */
export async function notifyPostgrestReloadSchema(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(`NOTIFY pgrst, 'reload schema'`);
    return true;
  } catch (e) {
    console.warn("[postgrest] NOTIFY reload schema skipped:", e);
    return false;
  }
}

/**
 * Idempotente: columnas que el checkout inserta vía PostgREST (`seller_id`, `total_amount`) y NOTIFY.
 * `total_amount` es el total cobrado al comprador en marketplace; Prisma `Order.total` puede coexistir.
 */
export async function ensureSupabaseOrdersSellerIdColumn(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS seller_id UUID`
    );
  } catch (e) {
    console.error("[checkout] ALTER public.orders ADD seller_id falló (¿misma DB que Supabase?):", e);
    return false;
  }
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount DOUBLE PRECISION`
    );
  } catch (e) {
    console.error("[checkout] ALTER public.orders ADD total_amount falló:", e);
    return false;
  }
  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_orders_seller_id_marketplace ON public.orders (seller_id)`
    );
  } catch {
    /* índice opcional */
  }
  return notifyPostgrestReloadSchema(prisma);
}

/**
 * Tabla usada por OAuth MP (`/api/seller/payment-gateway/mercadopago/callback`) anti-replay de `nonce`.
 * Idempotente; luego NOTIFY para PostgREST (PGRST205 "table not found").
 */
export async function ensureMpOauthUsedNoncesTable(prisma: PrismaClient): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS public.mp_oauth_used_nonces (
  nonce TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT mp_oauth_used_nonces_pkey PRIMARY KEY (nonce)
);
`);
  } catch (e) {
    console.error("[mp-oauth] CREATE mp_oauth_used_nonces falló:", e);
    return false;
  }
  return notifyPostgrestReloadSchema(prisma);
}
