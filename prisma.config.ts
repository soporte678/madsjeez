import path from "node:path";
import { defineConfig } from "prisma/config";
import dotenv from "dotenv";

// Cargar .env explícitamente (Prisma 6.19+ skipea env loading con config file)
dotenv.config();

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
