export type RiskLevel = "low" | "medium" | "high" | "critical";

export type CommandResult = {
  status: "ok" | "error" | "needs_confirmation" | "denied";
  summary: string;
  data?: Record<string, unknown>;
  confirmationToken?: string;
};

export type VoiceProfile = "atlas" | "nova";

export type DesktopCommandInput = {
  text: string;
  confirm?: boolean;
  confirmationToken?: string;
};

export type AuditEntry = {
  at: string;
  action: string;
  riskLevel: RiskLevel;
  ok: boolean;
  summary: string;
};
