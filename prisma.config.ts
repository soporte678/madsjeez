import { defineConfig } from "prisma/config";

// Usar variable de entorno o fallback a la URL hardcodeada (solo para desarrollo local)
const DATABASE_URL = process.env.DATABASE_URL || 
  "postgresql://postgres.svbzmvmmzaqkepeysjyk:Eze12ar432156%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    provider: "postgresql",
    url: DATABASE_URL,
  },
});
