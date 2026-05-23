import { sttFromPushToTalk } from "./stt.js";
import { speakText } from "./tts.js";
import type { CommandResult } from "../types.js";
import { routeCommand } from "../commands/command-router.js";

export async function handleVoiceStop(transcript: string): Promise<CommandResult> {
  const text = sttFromPushToTalk(transcript);
  const result = await routeCommand({ text });
  if (result.status === "ok" && result.summary) {
    await speakText(result.summary).catch(() => undefined);
  }
  return result;
}
