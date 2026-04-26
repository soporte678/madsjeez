import { defineConfig } from "prisma/config";

// Usar DIRECT_URL (puerto 5432) para migraciones, o fallback a URL hardcodeada
const DATABASE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL || 
  "postgresql://postgres.svbzmvmmzaqkepeysjyk:Eze12ar432156%24@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

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
