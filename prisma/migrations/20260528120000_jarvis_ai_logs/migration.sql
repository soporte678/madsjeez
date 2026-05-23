-- Jarvis AI model routing logs (isolated from ai_message_logs)

CREATE TABLE IF NOT EXISTS "jarvis_ai_logs" (
    "id" TEXT NOT NULL,
    "command" TEXT,
    "scope" TEXT,
    "tier" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "latency_ms" INTEGER NOT NULL,
    "escalated_to_14b" BOOLEAN NOT NULL DEFAULT false,
    "prompt_tokens_estimate" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jarvis_ai_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_ai_logs_command_created_at_idx" ON "jarvis_ai_logs"("command", "created_at");
CREATE INDEX IF NOT EXISTS "jarvis_ai_logs_tier_created_at_idx" ON "jarvis_ai_logs"("tier", "created_at");
