/** STT: push-to-talk vía texto en body. Integración Whisper opcional futura. */
export function sttFromPushToTalk(text: string): string {
  return text.replace(/^atlas[,:\s]+/i, "").replace(/^jarvis[,:\s]+/i, "").trim();
}

export function isWakeWordEnabled(): boolean {
  return false;
}
