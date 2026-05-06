import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7+: la URL del datasource vive en prisma.config.ts.
 * - En prod la URL viene de DATABASE_URL (Railway / runtime).
 * - `generate` en Docker build puede no tener DB real: placeholder solo para emitir el cliente.
 * - Migraciones: ejecutar fuera del container (Railway CLI / release). Supabase: puerto 6543 (pooler)
 *   suele fallar o colgar en `migrate deploy`; usar URL directa :5432 para migraciones.
 */
function prismaDatabaseUrl(): string {
  const u = process.env.DATABASE_URL?.trim();
  if (u) return u;
  return "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder?schema=public";
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    url: prismaDatabaseUrl(),
  },
});
