import type { CommandResult, DesktopCommandInput } from "../types.js";
import { config } from "../config.js";
import { getAction, canRunAction } from "../security/permissions.js";
import { createConfirmationToken, consumeConfirmationToken } from "../security/confirmations.js";
import { auditLog } from "../security/audit-log.js";
import { openCursor, openClaude, openWindsurf, openTerminalInRepo, openUrl } from "./app-actions.js";
import { writeAgentTask } from "../integrations/agent-task-writer.js";
import { fetchMarketplaceHealth, postMarketplaceOrchestrate } from "../integrations/marketplace-client.js";
import { speakText } from "../voice/tts.js";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[,.]/g, " ")
    .trim();
}

function parseIntent(text: string): { action: string; payload?: string } {
  const t = normalize(text);
  if (/estado del sistema|health|como estas/.test(t)) return { action: "marketplace_health" };
  if (/revis(a|ar) (el )?marketplace|auditoria marketplace/.test(t)) return { action: "marketplace_orchestrate" };
  if (/resum(i|e) errores|errores/.test(t)) return { action: "marketplace_orchestrate" };
  if (/reporte/.test(t) && /ventas|marketplace/.test(t)) return { action: "marketplace_orchestrate" };
  if (/cre(a|ar) (una )?tarea (para )?cursor/.test(t)) {
    const m = text.match(/para cursor\s+(.+)/i);
    return { action: "create_agent_task", payload: `cursor:${m?.[1] ?? "Revisar prioridad Jarvis"}` };
  }
  if (/cre(a|ar) tarea/.test(t) && /claude/.test(t)) return { action: "create_agent_task", payload: "claude:Análisis estratégico" };
  if (/abri(r)? cursor/.test(t)) return { action: "open_cursor" };
  if (/abri(r)? claude/.test(t)) return { action: "open_claude" };
  if (/abri(r)? windsurf/.test(t)) return { action: "open_windsurf" };
  if (/abri(r)? codex/.test(t)) return { action: "open_terminal" };
  if (/le(e|é)me el informe|informe/.test(t)) return { action: "speak_report", payload: text };
  if (/revis(a|ar) ollama/.test(t)) return { action: "marketplace_health" };
  if (/revis(a|ar) n8n/.test(t)) return { action: "marketplace_health" };
  if (/prompt/.test(t) && /arreglar/.test(t)) return { action: "create_agent_task", payload: "cursor:Arreglar según informe Jarvis" };
  return { action: "unknown" };
}

async function runAction(actionName: string, payload: string | undefined, input: DesktopCommandInput): Promise<CommandResult> {
  const def = getAction(actionName);
  if (!def) {
    return { status: "error", summary: `Acción desconocida: ${actionName}` };
  }
  if (!canRunAction(def, config.readOnly)) {
    return { status: "denied", summary: "Bloqueado en modo read-only." };
  }

  const needsConfirm = def.requiresConfirmation && config.requireConfirmation;
  if (needsConfirm && !input.confirm) {
    if (input.confirmationToken && consumeConfirmationToken(input.confirmationToken, actionName)) {
      // ok
    } else {
      const token = createConfirmationToken(actionName);
      return {
        status: "needs_confirmation",
        summary: `Confirmá acción riesgosa: ${def.description}`,
        confirmationToken: token,
      };
    }
  }

  try {
    switch (actionName) {
      case "open_cursor":
        await openCursor();
        return { status: "ok", summary: "Cursor abierto." };
      case "open_claude":
        await openClaude();
        return { status: "ok", summary: "Claude abierto." };
      case "open_windsurf":
        await openWindsurf();
        return { status: "ok", summary: "Windsurf abierto." };
      case "open_terminal":
        await openTerminalInRepo();
        return { status: "ok", summary: "Terminal abierta en el repo." };
      case "open_browser":
        await openUrl(payload || config.marketplaceUrl + "/admin/jarvis");
        return { status: "ok", summary: "Navegador abierto." };
      case "create_agent_task": {
        const [agent, ...rest] = (payload ?? "cursor:Tarea desktop").split(":");
        const objective = rest.join(":") || "Tarea desde Atlas Desktop";
        const a = agent as "cursor" | "claude" | "windsurf" | "codex";
        const path = await writeAgentTask(
          ["cursor", "claude", "windsurf", "codex"].includes(a) ? a : "cursor",
          objective
        );
        return { status: "ok", summary: `Tarea creada: ${path}`, data: { path } };
      }
      case "marketplace_health": {
        const h = await fetchMarketplaceHealth();
        return { status: "ok", summary: "Health remoto obtenido.", data: h };
      }
      case "marketplace_orchestrate": {
        const o = await postMarketplaceOrchestrate();
        return { status: "ok", summary: String(o.summary ?? "Orquestación enviada."), data: o };
      }
      case "speak_report": {
        await speakText(payload || "Informe listo en el panel Atlas.");
        return { status: "ok", summary: "Informe leído por voz." };
      }
      default:
        return { status: "denied", summary: "Acción no implementada en desktop." };
    }
  } catch (e) {
    return { status: "error", summary: e instanceof Error ? e.message : "error" };
  }
}

export async function routeCommand(input: DesktopCommandInput): Promise<CommandResult> {
  const intent = parseIntent(input.text);
  if (intent.action === "unknown") {
    return {
      status: "error",
      summary: "No entendí el comando. Probá: estado del sistema, abrir Cursor, crear tarea para Cursor.",
    };
  }

  const result = await runAction(intent.action, intent.payload, input);
  const def = getAction(intent.action);
  auditLog({
    action: intent.action,
    riskLevel: def?.riskLevel ?? "low",
    ok: result.status === "ok",
    summary: result.summary,
  });
  return result;
}
