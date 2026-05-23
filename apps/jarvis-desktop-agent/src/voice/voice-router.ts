import { parseVoiceTranscript, isWakeWordEnabled } from "./stt.js";
import { speakText } from "./tts.js";
import type { CommandResult } from "../types.js";
import { routeCommand } from "../commands/command-router.js";

export async function handleVoiceStop(transcript: string): Promise<CommandResult> {
  const parsed = parseVoiceTranscript(transcript, isWakeWordEnabled());
  if (!parsed.ok) {
    return { status: "error", summary: parsed.reason };
  }

  const result = await routeCommand({ text: parsed.command });
  if (result.status === "ok" && result.summary) {
    await speakText(result.summary).catch(() => undefined);
  }
  return result;
}
