import type { RiskLevel } from "../types.js";

export type ActionDef = {
  name: string;
  riskLevel: RiskLevel;
  requiresConfirmation: boolean;
  allowedInReadOnly: boolean;
  description: string;
};

export const ACTION_REGISTRY: Record<string, ActionDef> = {
  open_cursor: { name: "open_cursor", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir Cursor IDE" },
  open_claude: { name: "open_claude", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir Claude Code" },
  open_windsurf: { name: "open_windsurf", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir Windsurf" },
  open_codex: { name: "open_codex", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir terminal/Codex" },
  open_browser: { name: "open_browser", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir URL" },
  open_folder: { name: "open_folder", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir carpeta" },
  open_terminal: { name: "open_terminal", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Abrir terminal en repo" },
  create_agent_task: { name: "create_agent_task", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Crear .agent-tasks/*.md" },
  speak_report: { name: "speak_report", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "TTS informe interno" },
  marketplace_health: { name: "marketplace_health", riskLevel: "low", requiresConfirmation: false, allowedInReadOnly: true, description: "Health remoto" },
  marketplace_orchestrate: { name: "marketplace_orchestrate", riskLevel: "medium", requiresConfirmation: true, allowedInReadOnly: true, description: "Orquestar vía API" },
  run_terminal: { name: "run_terminal", riskLevel: "high", requiresConfirmation: true, allowedInReadOnly: false, description: "Ejecutar comando shell" },
  npm_install: { name: "npm_install", riskLevel: "high", requiresConfirmation: true, allowedInReadOnly: false, description: "Instalar dependencias" },
  deploy: { name: "deploy", riskLevel: "critical", requiresConfirmation: true, allowedInReadOnly: false, description: "Deploy producción" },
  db_migrate: { name: "db_migrate", riskLevel: "critical", requiresConfirmation: true, allowedInReadOnly: false, description: "Migración DB" },
  delete_files: { name: "delete_files", riskLevel: "critical", requiresConfirmation: true, allowedInReadOnly: false, description: "Prohibido por defecto" },
};

export function getAction(name: string): ActionDef | undefined {
  return ACTION_REGISTRY[name];
}

export function canRunAction(action: ActionDef, readOnly: boolean): boolean {
  if (readOnly && !action.allowedInReadOnly) return false;
  return true;
}
