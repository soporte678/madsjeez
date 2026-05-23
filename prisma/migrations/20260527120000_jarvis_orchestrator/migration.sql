-- Jarvis Orchestrator tables (read-only assistant, isolated from bot path)

CREATE TABLE IF NOT EXISTS "jarvis_reports" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'all',
    "summary" TEXT NOT NULL,
    "body" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_reports_type_created_at_idx" ON "jarvis_reports"("type", "created_at");

CREATE TABLE IF NOT EXISTS "jarvis_findings" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommended_action" TEXT,
    "agent_target" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_findings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_findings_scope_severity_status_idx" ON "jarvis_findings"("scope", "severity", "status");

CREATE TABLE IF NOT EXISTS "jarvis_agent_tasks" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_agent_tasks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_agent_tasks_agent_status_created_at_idx" ON "jarvis_agent_tasks"("agent", "status", "created_at");

CREATE TABLE IF NOT EXISTS "jarvis_health_checks" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_health_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_health_checks_created_at_idx" ON "jarvis_health_checks"("created_at");

CREATE TABLE IF NOT EXISTS "jarvis_voice_reports" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "profile" TEXT NOT NULL DEFAULT 'atlas',
    "audio_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_voice_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_voice_reports_created_at_idx" ON "jarvis_voice_reports"("created_at");

CREATE TABLE IF NOT EXISTS "jarvis_audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "jarvis_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "jarvis_audit_logs_action_created_at_idx" ON "jarvis_audit_logs"("action", "created_at");
