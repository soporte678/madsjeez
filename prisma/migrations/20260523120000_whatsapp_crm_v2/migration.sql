-- WhatsApp CRM v2: contact enrichment, message source, sync jobs

CREATE TYPE "WhatsappMessageSource" AS ENUM ('webhook', 'history_sync', 'manual', 'bot');
CREATE TYPE "WhatsappSyncJobType" AS ENUM ('contacts', 'chats', 'messages', 'full');
CREATE TYPE "WhatsappSyncJobStatus" AS ENUM ('pending', 'running', 'completed', 'partial_error', 'failed');

ALTER TABLE "seller_bot_configs" ADD COLUMN IF NOT EXISTS "allow_whatsapp_groups" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "jid" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "push_name" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "first_name" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "business_name" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "verified_name" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "profile_pic_url" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "is_business" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "whatsapp_labels" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "about" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "raw_whatsapp_data" JSONB;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "whatsapp_leads_seller_id_jid_idx" ON "whatsapp_leads"("seller_id", "jid");

ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "ai_summary" TEXT;

ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "source" "WhatsappMessageSource" NOT NULL DEFAULT 'webhook';
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "remote_jid" TEXT;

CREATE INDEX IF NOT EXISTS "whatsapp_messages_provider_message_id_idx" ON "whatsapp_messages"("provider_message_id");

CREATE TABLE IF NOT EXISTS "whatsapp_sync_jobs" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "type" "WhatsappSyncJobType" NOT NULL,
    "status" "WhatsappSyncJobStatus" NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "total_found" INTEGER NOT NULL DEFAULT 0,
    "total_created" INTEGER NOT NULL DEFAULT 0,
    "total_updated" INTEGER NOT NULL DEFAULT 0,
    "total_skipped" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_sync_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "whatsapp_sync_jobs_seller_id_created_at_idx" ON "whatsapp_sync_jobs"("seller_id", "created_at");

ALTER TABLE "whatsapp_sync_jobs" ADD CONSTRAINT "whatsapp_sync_jobs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
