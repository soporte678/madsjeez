-- Reparación manual en Supabase SQL Editor si migrate deploy sigue bloqueado.
-- 1) Si flash_shipments ya existe pero add_flash_system figura fallida:
--    npx prisma migrate resolve --applied "20260520200000_add_flash_system"
-- 2) Luego ejecutá este SQL (idempotente) y redeploy.

-- Contenido equivalente a 20260521120000_flash_driver_dashboard (resumido)

DO $$ BEGIN
  CREATE TYPE "FlashDriverDutyStatus" AS ENUM ('OFFLINE', 'ONLINE', 'ON_TRIP', 'ON_BREAK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FlashDriverTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FlashEarningStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FlashSupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FlashBlockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "duty_status" "FlashDriverDutyStatus" NOT NULL DEFAULT 'OFFLINE';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "work_mode" TEXT NOT NULL DEFAULT 'hybrid';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "tier" "FlashDriverTier" NOT NULL DEFAULT 'BRONZE';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "acceptance_rate" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "payout_cbu" TEXT;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "connected_at" TIMESTAMP(3);
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "total_km" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "flash_rate_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "label" TEXT NOT NULL DEFAULT 'Tarifas Flash Argentina',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "settings" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    CONSTRAINT "flash_rate_config_pkey" PRIMARY KEY ("id")
);

INSERT INTO "flash_rate_config" ("id", "label", "currency", "settings", "updated_at")
VALUES (
  'default',
  'Tarifas Flash Argentina',
  'ARS',
  '{"basePerOrder":3032.9,"basePerPackage":2850,"extraPerKm":180,"extraWaitPerMinute":45,"rainBonusPercent":15,"nightBonusPercent":12,"highDemandBonusPercent":20,"difficultZoneBonusPercent":10,"minGuaranteedPerBlock":12000,"platformCommissionPercent":8,"defaultTipEstimate":0}'::jsonb,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
