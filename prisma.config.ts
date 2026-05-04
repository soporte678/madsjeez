import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema.prisma",
  defaultDatasource: {
    provider: "postgresql",
    url: process.env.DATABASE_URL
  }
});
