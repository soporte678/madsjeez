/** Wake word + normalización (compartido web widget / API voz). */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\w\sáéíóúñ]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const WAKE_PATTERNS = [
  /\batlas\b/,
  /\bjarvis\b/,
  /\bat las\b/,
  /\ba tl[ao]s\b/,
  /\batl[ao]s\b/,
];

export function hasWakeWord(text: string): boolean {
  const n = normalize(text);
  return WAKE_PATTERNS.some((p) => p.test(n));
}

export function stripWakePrefix(text: string): string {
  return text
    .replace(/^atlas[,:\s]+/i, "")
    .replace(/^jarvis[,:\s]+/i, "")
    .replace(/^atlas\s+/i, "")
    .trim();
}

export type VoiceParseResult =
  | { ok: true; command: string; raw: string }
  | { ok: false; reason: string; raw: string };

export function parseVoiceTranscript(raw: string, requireWake = true): VoiceParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: "No se escuchó nada. Mantené el botón y decí «Atlas, …»", raw: "" };
  }

  if (requireWake && !hasWakeWord(trimmed)) {
    return {
      ok: false,
      reason:
        "No detecté «Atlas». Empezá con: «Atlas, estado del sistema» (evita falsos positivos).",
      raw: trimmed,
    };
  }

  const command = stripWakePrefix(trimmed);
  if (command.length < 2) {
    return {
      ok: false,
      reason: "Falta el comando después de «Atlas». Ej: Atlas, revisá el Marketplace",
      raw: trimmed,
    };
  }

  return { ok: true, command, raw: trimmed };
}

export function isWakeWordRequired(): boolean {
  return process.env.JARVIS_WAKE_WORD_ENABLED?.trim().toLowerCase() !== "false";
}
