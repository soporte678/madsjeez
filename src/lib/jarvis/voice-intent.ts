import type { JarvisCommandInput, JarvisReportType } from "@/jarvis/types";
import { parseVoiceTranscript as parseWake, type VoiceParseResult } from "@/lib/jarvis/wake-word";
import { speakAtlasBrowser, type AtlasVoiceProfile } from "@/lib/jarvis/atlas-speech-synthesis";

export type VoiceRouteWeb = {
  kind: "web";
  input: JarvisCommandInput;
  reportType?: JarvisReportType;
};

export type VoiceRouteDesktop = {
  kind: "desktop";
  summary: string;
  hint: string;
};

export type VoiceRouteUnknown = {
  kind: "unknown";
  summary: string;
};

export type VoiceRouteResult = VoiceRouteWeb | VoiceRouteDesktop | VoiceRouteUnknown;

/** Ruta para el widget React (fetch directo o desktop bridge). */
export type VoiceRoute =
  | { kind: "error"; message: string }
  | { kind: "desktop"; text: string; label: string }
  | { kind: "web"; path: string; body: Record<string, unknown>; label: string };

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[,.]/g, " ")
    .trim();
}

export function routeVoiceCommand(command: string): VoiceRouteResult {
  const t = normalize(command);
  const raw = command.trim();

  if (/estado del sistema|health check|como estas/.test(t)) {
    return { kind: "web", input: { command: "health", scope: "all", detail: "short" } };
  }

  if (/orquest(a|ar)|auditoria completa/.test(t)) {
    return {
      kind: "web",
      input: { command: "orchestrate", scope: "all", agentTarget: "auto", message: raw },
    };
  }

  if (/revis(a|ar) (el )?marketplace|auditoria marketplace/.test(t)) {
    return {
      kind: "web",
      input: { command: "audit-marketplace", scope: "marketplace", detail: "normal" },
    };
  }

  if (/resum(i|e) errores|detect(a|ar) errores|errores/.test(t)) {
    return { kind: "web", input: { command: "detect-errors", scope: "all", detail: "normal" } };
  }

  if (/mejor(a|ar)|sugerencias|suggest/.test(t)) {
    return { kind: "web", input: { command: "suggest-improvements", scope: "all", detail: "normal" } };
  }

  if (/cre(a|ar) (una )?tarea/.test(t)) {
    const agent = /claude/.test(t) ? "claude" : /windsurf/.test(t) ? "windsurf" : /codex/.test(t) ? "codex" : "cursor";
    const m = raw.match(/tarea\s+(?:para\s+)?\w+\s+(.+)/i);
    return {
      kind: "web",
      input: {
        command: "create-agent-task",
        scope: /whatsapp|bot/.test(t) ? "whatsapp" : "all",
        agentTarget: agent,
        message: m?.[1] ?? raw,
      },
    };
  }

  if (/reporte/.test(t) && /ventas|marketplace/.test(t)) {
    return {
      kind: "web",
      input: { command: "audit-marketplace", scope: "marketplace", detail: "short" },
      reportType: "daily_marketplace_report",
    };
  }

  if (/le(e|é)me el informe|informe de voz|voz/.test(t)) {
    return { kind: "web", input: { command: "voice-report", scope: "all", detail: "short" } };
  }

  if (/abri(r)? cursor|abri(r)? claude|abri(r)? windsurf|abri(r)? codex|terminal/.test(t)) {
    return {
      kind: "desktop",
      summary: "Ese comando abre apps en tu PC (solo Desktop Agent).",
      hint: "Abrí http://127.0.0.1:8787/voice en Chrome/Edge con el agente local corriendo.",
    };
  }

  if (/revis(a|ar) ollama|revis(a|ar) n8n/.test(t)) {
    return {
      kind: "web",
      input: { command: "health", scope: /ollama/.test(t) ? "ollama" : "n8n", detail: "normal" },
    };
  }

  return {
    kind: "unknown",
    summary:
      "No reconocí el comando. Probá: «Atlas, estado del sistema», «Atlas, orquestá», «Atlas, revisá el Marketplace».",
  };
}

function webRouteFromInput(
  input: JarvisCommandInput,
  reportType: JarvisReportType | undefined,
  label: string
): VoiceRoute {
  if (input.command === "orchestrate") {
    return {
      kind: "web",
      path: "/api/jarvis/orchestrate",
      body: {
        scope: input.scope,
        detail: input.detail,
        agentTarget: input.agentTarget,
        message: input.message,
      },
      label,
    };
  }
  if (reportType) {
    return {
      kind: "web",
      path: "/api/jarvis/report",
      body: { type: reportType, scope: input.scope ?? "all" },
      label,
    };
  }
  return {
    kind: "web",
    path: "/api/jarvis/command",
    body: input as unknown as Record<string, unknown>,
    label,
  };
}

/** Parsea transcript completo (con wake word) → ruta ejecutable en el widget. */
export function parseVoiceTranscript(raw: string, requireWake: boolean): VoiceRoute {
  const parsed: VoiceParseResult = parseWake(raw, requireWake);
  if (!parsed.ok) {
    return { kind: "error", message: parsed.reason };
  }

  const routed = routeVoiceCommand(parsed.command);
  const label = parsed.raw || raw.trim();

  if (routed.kind === "unknown") {
    return { kind: "error", message: routed.summary };
  }

  if (routed.kind === "desktop") {
    return { kind: "desktop", text: label, label: parsed.command };
  }

  return webRouteFromInput(routed.input, routed.reportType, label);
}

export function speakAtlas(text: string, profile: AtlasVoiceProfile = "atlas"): void {
  void speakAtlasBrowser(text, profile);
}
