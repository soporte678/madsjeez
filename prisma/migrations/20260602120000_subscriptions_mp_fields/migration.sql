-- CRIT-4: alinear tabla `subscriptions` con el modelo Prisma (MercadoPago como source of truth).
-- Idempotente: usa IF NOT EXISTS para correrse aunque algunas columnas ya existan.

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "total_amount" DECIMAL(12, 2);

-- Backfill: si no existe total_amount lo dejamos en price * billing_cycle
UPDATE "subscriptions"
SET "total_amount" = COALESCE("total_amount", "price" * COALESCE("billing_cycle", 1))
WHERE "total_amount" IS NULL;

ALTER TABLE "subscriptions"
  ALTER COLUMN "total_amount" SET NOT NULL;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "mp_preference_id" TEXT;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "mp_payment_id" TEXT;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "mp_status" TEXT;

-- Tabla idempotencia webhook (si aún no existe en este entorno)
CREATE TABLE IF NOT EXISTS "mp_webhook_processed" (
  "payment_id" TEXT PRIMARY KEY,
  "last_mp_status" TEXT,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "subscriptions_mp_preference_id_idx"
  ON "subscriptions" ("mp_preference_id");
