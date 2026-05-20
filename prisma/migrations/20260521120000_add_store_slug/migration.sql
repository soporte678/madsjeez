-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "store_slug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_store_slug_key" ON "users"("store_slug");
