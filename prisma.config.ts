import { defineConfig } from "prisma/config";

// URL hardcodeada para migraciones
const DATABASE_URL = "postgresql://postgres.svbzmvmmzaqkepeysjyk:Eze12ar432156%24@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

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
