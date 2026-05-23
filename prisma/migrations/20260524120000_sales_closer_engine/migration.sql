-- Sales Closer engine: lead CRM fields, decisions log, winning responses (learning)

CREATE TYPE "WhatsappSaleOutcome" AS ENUM ('open', 'won', 'lost');

ALTER TABLE "seller_bot_configs" ADD COLUMN IF NOT EXISTS "business_profile" TEXT;

ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "rubro" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "objecion" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "dato_faltante" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "sale_outcome" "WhatsappSaleOutcome" NOT NULL DEFAULT 'open';
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "loss_reason" TEXT;
ALTER TABLE "whatsapp_leads" ADD COLUMN IF NOT EXISTS "business_profile" TEXT;

CREATE INDEX IF NOT EXISTS "whatsapp_leads_seller_id_rubro_idx" ON "whatsapp_leads"("seller_id", "rubro");
CREATE INDEX IF NOT EXISTS "whatsapp_leads_seller_id_sale_outcome_idx" ON "whatsapp_leads"("seller_id", "sale_outcome");

CREATE TABLE IF NOT EXISTS "whatsapp_closer_decisions" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "lead_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "business_profile" TEXT,
    "rubro" TEXT,
    "intencion" TEXT,
    "etapa_lead" TEXT,
    "objecion" TEXT,
    "dato_faltante" TEXT,
    "accion_recomendada" TEXT,
    "derivar_humano" BOOLEAN NOT NULL DEFAULT false,
    "respuesta_cliente" TEXT NOT NULL,
    "etiquetas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "model_used" TEXT,
    "raw_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_closer_decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "whatsapp_winning_responses" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "conversation_id" TEXT,
    "rubro" TEXT NOT NULL,
    "intencion" TEXT,
    "objecion" TEXT,
    "customer_snippet" TEXT,
    "winning_response" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "use_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_winning_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "whatsapp_closer_decisions_seller_id_created_at_idx" ON "whatsapp_closer_decisions"("seller_id", "created_at");
CREATE INDEX IF NOT EXISTS "whatsapp_closer_decisions_lead_id_created_at_idx" ON "whatsapp_closer_decisions"("lead_id", "created_at");
CREATE INDEX IF NOT EXISTS "whatsapp_closer_decisions_conversation_id_created_at_idx" ON "whatsapp_closer_decisions"("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "whatsapp_winning_responses_seller_id_rubro_idx" ON "whatsapp_winning_responses"("seller_id", "rubro");
CREATE INDEX IF NOT EXISTS "whatsapp_winning_responses_seller_id_intencion_idx" ON "whatsapp_winning_responses"("seller_id", "intencion");

ALTER TABLE "whatsapp_closer_decisions" ADD CONSTRAINT "whatsapp_closer_decisions_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_closer_decisions" ADD CONSTRAINT "whatsapp_closer_decisions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "whatsapp_closer_decisions" ADD CONSTRAINT "whatsapp_closer_decisions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "whatsapp_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_winning_responses" ADD CONSTRAINT "whatsapp_winning_responses_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_winning_responses" ADD CONSTRAINT "whatsapp_winning_responses_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "whatsapp_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
