-- Mercado Libre: multi-cuenta por vendedor, categorías ML, payload sync y variaciones

DROP INDEX IF EXISTS "seller_meli_oauth_user_id_key";

ALTER TABLE "seller_meli_oauth" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "seller_meli_oauth" ADD COLUMN IF NOT EXISTS "label" TEXT;
ALTER TABLE "seller_meli_oauth" ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "seller_meli_oauth_user_id_meli_user_id_key" ON "seller_meli_oauth"("user_id", "meli_user_id");
CREATE INDEX IF NOT EXISTS "seller_meli_oauth_user_id_idx" ON "seller_meli_oauth"("user_id");

UPDATE "seller_meli_oauth" s SET "is_primary" = true
WHERE (SELECT COUNT(*)::int FROM "seller_meli_oauth" x WHERE x."user_id" = s."user_id") = 1;

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "meli_category_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "categories_meli_category_id_key" ON "categories"("meli_category_id");

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_oauth_account_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_category_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_listing_type_id" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_status" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_permalink" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_currency_id" TEXT DEFAULT 'ARS';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_payload" JSONB;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_last_synced_at" TIMESTAMP(3);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_stock_sync_enabled" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "products_meli_oauth_account_id_idx" ON "products"("meli_oauth_account_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_meli_oauth_account_id_fkey'
  ) THEN
    ALTER TABLE "products"
      ADD CONSTRAINT "products_meli_oauth_account_id_fkey"
      FOREIGN KEY ("meli_oauth_account_id") REFERENCES "seller_meli_oauth"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "product_variations" ADD COLUMN IF NOT EXISTS "meli_variation_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "product_variations_meli_variation_id_key" ON "product_variations"("meli_variation_id");
