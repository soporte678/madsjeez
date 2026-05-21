-- Flash driver dashboard: tarifas, ganancias, soporte, bloques Flex

CREATE TYPE "FlashDriverDutyStatus" AS ENUM ('OFFLINE', 'ONLINE', 'ON_TRIP', 'ON_BREAK');
CREATE TYPE "FlashDriverTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');
CREATE TYPE "FlashEarningStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID');
CREATE TYPE "FlashSupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');
CREATE TYPE "FlashBlockStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "duty_status" "FlashDriverDutyStatus" NOT NULL DEFAULT 'OFFLINE';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "work_mode" TEXT NOT NULL DEFAULT 'hybrid';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 5;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "tier" "FlashDriverTier" NOT NULL DEFAULT 'BRONZE';
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "acceptance_rate" DOUBLE PRECISION NOT NULL DEFAULT 100;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "payout_cbu" TEXT;
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "connected_at" TIMESTAMP(3);
ALTER TABLE "flash_drivers" ADD COLUMN IF NOT EXISTS "total_km" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "flash_drivers_duty_status_idx" ON "flash_drivers"("duty_status");

CREATE TABLE IF NOT EXISTS "flash_rate_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "label" TEXT NOT NULL DEFAULT 'Tarifas Flash Argentina',
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "settings" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "flash_rate_config_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "flash_driver_earnings" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "shipment_id" TEXT,
    "type" TEXT NOT NULL DEFAULT 'DELIVERY',
    "description" TEXT NOT NULL,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "tip_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extras" JSONB,
    "status" "FlashEarningStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flash_driver_earnings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "flash_driver_earnings_shipment_id_key" ON "flash_driver_earnings"("shipment_id");
CREATE INDEX IF NOT EXISTS "flash_driver_earnings_driver_id_created_at_idx" ON "flash_driver_earnings"("driver_id", "created_at");
CREATE INDEX IF NOT EXISTS "flash_driver_earnings_status_idx" ON "flash_driver_earnings"("status");

ALTER TABLE "flash_driver_earnings" ADD CONSTRAINT "flash_driver_earnings_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "flash_support_tickets" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT,
    "shipment_id" TEXT,
    "status" "FlashSupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "flash_support_tickets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "flash_support_tickets_driver_id_status_idx" ON "flash_support_tickets"("driver_id", "status");

ALTER TABLE "flash_support_tickets" ADD CONSTRAINT "flash_support_tickets_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "flash_driver_blocks" (
    "id" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "guaranteed_pay" DOUBLE PRECISION NOT NULL,
    "estimated_packages" INTEGER NOT NULL,
    "pickup_point" TEXT NOT NULL,
    "status" "FlashBlockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "driver_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flash_driver_blocks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "flash_driver_blocks_status_starts_at_idx" ON "flash_driver_blocks"("status", "starts_at");
CREATE INDEX IF NOT EXISTS "flash_driver_blocks_driver_id_idx" ON "flash_driver_blocks"("driver_id");

ALTER TABLE "flash_driver_blocks" ADD CONSTRAINT "flash_driver_blocks_driver_id_fkey"
  FOREIGN KEY ("driver_id") REFERENCES "flash_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
