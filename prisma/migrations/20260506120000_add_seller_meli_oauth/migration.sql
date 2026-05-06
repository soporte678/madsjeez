-- Mercado Libre OAuth por usuario + campos de sincronización

CREATE TABLE "seller_meli_oauth" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meli_user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_meli_oauth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "seller_meli_oauth_user_id_key" ON "seller_meli_oauth"("user_id");

ALTER TABLE "seller_meli_oauth" ADD CONSTRAINT "seller_meli_oauth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "meli_item_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "products_meli_item_id_key" ON "products"("meli_item_id");

ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "meli_promotion_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "campaigns_seller_id_meli_promotion_id_key" ON "campaigns"("seller_id", "meli_promotion_id");
