import { defineConfig } from "prisma/config";

// Usar DATABASE_URL del entorno (Railway/Supabase)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL no está configurada");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  defaultDatasource: {
    provider: "postgresql",
    url: { fromEnv: "DATABASE_URL" }
  }
});
