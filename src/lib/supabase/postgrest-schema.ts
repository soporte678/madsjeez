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
 * Idempotente: asegura `public.orders.seller_id` (checkout marketplace) y recarga PostgREST.
 * Solo invocar tras PGRST204; requiere permiso DDL en la misma DB que usa `DATABASE_URL`.
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
      `CREATE INDEX IF NOT EXISTS idx_orders_seller_id_marketplace ON public.orders (seller_id)`
    );
  } catch {
    /* índice opcional */
  }
  return notifyPostgrestReloadSchema(prisma);
}
