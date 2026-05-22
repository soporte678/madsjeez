-- AlterTable
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "internal_notes" TEXT;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WhatsappCampaignStatus" AS ENUM ('draft', 'scheduled', 'running', 'paused', 'finished');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "whatsapp_automations" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "trigger_config" JSONB NOT NULL DEFAULT '{}',
    "action_type" TEXT NOT NULL,
    "action_config" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_automations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_campaigns" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "segment" JSONB NOT NULL DEFAULT '{}',
    "message_template" TEXT NOT NULL,
    "status" "WhatsappCampaignStatus" NOT NULL DEFAULT 'draft',
    "scheduled_at" TIMESTAMP(3),
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "delivered_count" INTEGER NOT NULL DEFAULT 0,
    "replied_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "whatsapp_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "whatsapp_automations_seller_id_enabled_idx" ON "whatsapp_automations"("seller_id", "enabled");
CREATE INDEX IF NOT EXISTS "whatsapp_campaigns_seller_id_status_idx" ON "whatsapp_campaigns"("seller_id", "status");

ALTER TABLE "whatsapp_automations" DROP CONSTRAINT IF EXISTS "whatsapp_automations_seller_id_fkey";
ALTER TABLE "whatsapp_automations" ADD CONSTRAINT "whatsapp_automations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_campaigns" DROP CONSTRAINT IF EXISTS "whatsapp_campaigns_seller_id_fkey";
ALTER TABLE "whatsapp_campaigns" ADD CONSTRAINT "whatsapp_campaigns_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
