-- CreateEnum
CREATE TYPE "WhatsappSessionStatus" AS ENUM ('disconnected', 'qr_pending', 'connected', 'error');
CREATE TYPE "WhatsappProviderKind" AS ENUM ('evolution', 'waha', 'baileys', 'whatsapp_web_js');
CREATE TYPE "WhatsappBotTone" AS ENUM ('cercano', 'profesional', 'rapido', 'experto');
CREATE TYPE "WhatsappLeadStatus" AS ENUM ('new', 'warm', 'hot', 'customer', 'closed', 'lost');
CREATE TYPE "WhatsappConversationStatus" AS ENUM ('bot_active', 'human_active', 'closed');
CREATE TYPE "WhatsappMessageDirection" AS ENUM ('inbound', 'outbound');
CREATE TYPE "WhatsappMessageSenderType" AS ENUM ('customer', 'bot', 'seller', 'system');
CREATE TYPE "WhatsappMessageType" AS ENUM ('text', 'image', 'audio', 'file', 'location');
CREATE TYPE "WhatsappHandoffStatus" AS ENUM ('requested', 'accepted', 'resolved');

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "store_id" TEXT,
    "provider" "WhatsappProviderKind" NOT NULL DEFAULT 'evolution',
    "provider_instance_id" TEXT NOT NULL,
    "status" "WhatsappSessionStatus" NOT NULL DEFAULT 'disconnected',
    "phone_number" TEXT,
    "qr_code" TEXT,
    "last_connected_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "seller_bot_configs" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "store_id" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "tone" "WhatsappBotTone" NOT NULL DEFAULT 'cercano',
    "business_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "business_hours" JSONB,
    "auto_reply_enabled" BOOLEAN NOT NULL DEFAULT true,
    "human_handoff_enabled" BOOLEAN NOT NULL DEFAULT true,
    "max_auto_messages_before_handoff" INTEGER NOT NULL DEFAULT 12,
    "custom_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_bot_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_leads" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "store_id" TEXT,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" "WhatsappLeadStatus" NOT NULL DEFAULT 'new',
    "intent" TEXT,
    "last_message_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "store_id" TEXT,
    "lead_id" TEXT NOT NULL,
    "whatsapp_session_id" TEXT,
    "phone" TEXT NOT NULL,
    "status" "WhatsappConversationStatus" NOT NULL DEFAULT 'bot_active',
    "bot_message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "direction" "WhatsappMessageDirection" NOT NULL,
    "sender_type" "WhatsappMessageSenderType" NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" "WhatsappMessageType" NOT NULL DEFAULT 'text',
    "provider_message_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_bot_events" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "store_id" TEXT,
    "conversation_id" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_bot_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_human_handoffs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "reason" TEXT,
    "status" "WhatsappHandoffStatus" NOT NULL DEFAULT 'requested',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "whatsapp_human_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_seller_id_key" ON "whatsapp_sessions"("seller_id");
CREATE INDEX "whatsapp_sessions_provider_instance_id_idx" ON "whatsapp_sessions"("provider_instance_id");

CREATE UNIQUE INDEX "seller_bot_configs_seller_id_key" ON "seller_bot_configs"("seller_id");

CREATE UNIQUE INDEX "whatsapp_leads_seller_id_phone_key" ON "whatsapp_leads"("seller_id", "phone");
CREATE INDEX "whatsapp_leads_seller_id_status_idx" ON "whatsapp_leads"("seller_id", "status");

CREATE UNIQUE INDEX "whatsapp_conversations_seller_id_phone_key" ON "whatsapp_conversations"("seller_id", "phone");
CREATE INDEX "whatsapp_conversations_seller_id_status_idx" ON "whatsapp_conversations"("seller_id", "status");

CREATE INDEX "whatsapp_messages_conversation_id_created_at_idx" ON "whatsapp_messages"("conversation_id", "created_at");

CREATE INDEX "whatsapp_bot_events_seller_id_created_at_idx" ON "whatsapp_bot_events"("seller_id", "created_at");

CREATE INDEX "whatsapp_human_handoffs_conversation_id_status_idx" ON "whatsapp_human_handoffs"("conversation_id", "status");

-- AddForeignKey
ALTER TABLE "whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_bot_configs" ADD CONSTRAINT "seller_bot_configs_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_leads" ADD CONSTRAINT "whatsapp_leads_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "whatsapp_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_whatsapp_session_id_fkey" FOREIGN KEY ("whatsapp_session_id") REFERENCES "whatsapp_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_bot_events" ADD CONSTRAINT "whatsapp_bot_events_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_bot_events" ADD CONSTRAINT "whatsapp_bot_events_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_human_handoffs" ADD CONSTRAINT "whatsapp_human_handoffs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
