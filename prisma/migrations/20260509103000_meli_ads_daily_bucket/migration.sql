-- Corte diario PADs + auditoría updated_at (una fila por usuario y día civil AR)

ALTER TABLE "meli_ads_snapshots" ADD COLUMN IF NOT EXISTS "bucket_date_key" TEXT;
ALTER TABLE "meli_ads_snapshots" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "meli_ads_snapshots_user_bucket_key" ON "meli_ads_snapshots"("user_id", "bucket_date_key");
CREATE INDEX IF NOT EXISTS "meli_ads_snapshots_user_id_bucket_date_key_idx" ON "meli_ads_snapshots"("user_id", "bucket_date_key" DESC);
