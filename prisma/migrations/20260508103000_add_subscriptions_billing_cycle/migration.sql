-- Ciclo de facturación en suscripciones (schema ya lo esperaba; faltaba en BD prod)

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_cycle" INTEGER NOT NULL DEFAULT 1;
