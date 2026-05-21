import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

/** Clave estable en rango bigint de Postgres (evita colisiones triviales entre vendedores). */
export function mpOAuthRefreshAdvisoryKey(sellerId: string): bigint {
  const buf = createHash("sha256").update(`madsjeez:mp_oauth_refresh:${sellerId}`).digest();
  const n = buf.readBigUInt64BE(0);
  const mask = (BigInt(1) << BigInt(62)) - BigInt(1);
  const masked = n & mask;
  return masked === BigInt(0) ? BigInt(1) : masked;
}

/**
 * Bloqueo de sesión en Postgres: serializa el callback entre conexiones (p. ej. varias réplicas Railway)
 * que comparten la misma DATABASE_URL que Supabase.
 */
export async function withSessionAdvisoryBigintLock<T>(
  prisma: PrismaClient,
  key: bigint,
  fn: () => Promise<T>
): Promise<T> {
  const k = key.toString();
  await prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(${k}::bigint)`);
  try {
    return await fn();
  } finally {
    try {
      await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(${k}::bigint)`);
    } catch {
      /* si la conexión cayó, el lock se libera al cerrar la sesión */
    }
  }
}
