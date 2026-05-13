import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7+: la URL del datasource vive en prisma.config.ts.
 * - En prod la URL viene de DATABASE_URL (Railway / runtime).
 * - `generate` en Docker build puede no tener DB real: placeholder solo para emitir el cliente.
 * - Migraciones: en Docker el entrypoint ejecuta `node migrate.mjs` salvo SKIP_DB_MIGRATIONS_ON_BOOT=true.
 *   Con Supabase pooler :6543, migrate deriva **session pooler :5432** (IPv4-friendly). `db.*:5432` directo es IPv6 por defecto.
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
