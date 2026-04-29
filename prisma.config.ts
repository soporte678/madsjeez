import { defineConfig } from "prisma/config";

// Usar DIRECT_URL (puerto 5432) para migraciones, fallback a DATABASE_URL
const MIGRATE_URL = process.env.DIRECT_URL || process.env.DATABASE_URL || 
  "postgresql://postgres.doweovsukuskflgnxhhn:NXnPpq963f1oFIGI@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  migrate: {
    url: MIGRATE_URL,
  },
  datasource: {
    provider: "postgresql",
    url: MIGRATE_URL,
  },
});
