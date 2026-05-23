CREATE TABLE IF NOT EXISTS "ai_message_logs" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "customer_id" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'whatsapp',
    "incoming_message" TEXT NOT NULL,
    "selected_model" TEXT,
    "model_reason" TEXT,
    "confidence" DOUBLE PRECISION,
    "latency_ms" INTEGER,
    "escalated_to_14b" BOOLEAN NOT NULL DEFAULT false,
    "detected_rubro" TEXT,
    "detected_intent" TEXT,
    "detected_stage" TEXT,
    "objection" TEXT,
    "reply" TEXT,
    "fallback_used" BOOLEAN NOT NULL DEFAULT false,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_message_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_message_logs_conversation_id_created_at_idx"
  ON "ai_message_logs"("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_message_logs_customer_id_created_at_idx"
  ON "ai_message_logs"("customer_id", "created_at");
CREATE INDEX IF NOT EXISTS "ai_message_logs_channel_created_at_idx"
  ON "ai_message_logs"("channel", "created_at");
