export type JarvisScope =
  | "marketplace"
  | "whatsapp"
  | "ollama"
  | "n8n"
  | "railway"
  | "supabase"
  | "repo"
  | "all";

export type JarvisCommand =
  | "audit-marketplace"
  | "health"
  | "create-agent-task"
  | "voice-report"
  | "detect-errors"
  | "suggest-improvements"
  | "orchestrate";

export type JarvisDetail = "short" | "normal" | "full";

export type JarvisAgentTarget = "cursor" | "claude" | "windsurf" | "codex" | "all" | "auto";

export type JarvisSeverity = "low" | "medium" | "high" | "critical";

export type JarvisFindingStatus = "open" | "in_progress" | "done" | "ignored";

export type JarvisCommandInput = {
  command: JarvisCommand;
  scope?: JarvisScope;
  detail?: JarvisDetail;
  agentTarget?: JarvisAgentTarget;
  message?: string;
};

export type JarvisFinding = {
  id: string;
  scope: JarvisScope | string;
  severity: JarvisSeverity;
  title: string;
  description: string;
  recommendedAction?: string;
  agentTarget?: JarvisAgentTarget | string;
  status: JarvisFindingStatus;
  createdAt: string;
};

export type JarvisAgentTaskRef = {
  agent: JarvisAgentTarget | string;
  path: string;
  objective: string;
};

export type JarvisCommandOutput = {
  status: "ok" | "disabled" | "error";
  summary: string;
  findings: JarvisFinding[];
  recommendations: string[];
  agentTasks: JarvisAgentTaskRef[];
  voiceReportText?: string;
  voiceReportUrl?: string;
  requiresConfirmation: boolean;
  reportId?: string;
};

export type JarvisReportType =
  | "daily_marketplace_report"
  | "weekly_sales_learning_report"
  | "bot_health_report"
  | "ollama_latency_report"
  | "n8n_workflows_report"
  | "errors_report"
  | "improvement_report";

export type JarvisHealthSnapshot = {
  backend: { ok: boolean; detail?: string };
  ollama: { ok: boolean; models?: string[]; detail?: string };
  n8n: { ok: boolean; configured: boolean; detail?: string };
  database: { ok: boolean; detail?: string };
  automation: { webhookConfigured: boolean };
  flags: {
    enabled: boolean;
    readOnly: boolean;
    allowAgentTasks: boolean;
    allowCodeChanges: boolean;
    allowDeploy: boolean;
  };
  checkedAt: string;
};
