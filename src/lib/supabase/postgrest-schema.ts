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
