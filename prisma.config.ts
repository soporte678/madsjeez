import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7+: la URL del datasource vive en prisma.config.ts.
 * - En Railway el entrypoint exporta DATABASE_URL antes de `migrate deploy`.
 * - Durante `prisma generate` en Docker a veces no hay URL: usamos placeholder solo para generar el cliente (no conecta).
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
