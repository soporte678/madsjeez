import { spawn } from "child_process";
import { config } from "../config.js";
import type { VoiceProfile } from "../types.js";

/** TTS local Windows — voces del sistema; Atlas/Nova = estilo de guion, sin clonar personajes. */
export async function speakText(text: string, profile?: VoiceProfile): Promise<void> {
  const p = profile ?? config.voiceProfile;
  const prefix = p === "nova" ? "Informe Atlas, tono profesional y cálido. " : "Informe Atlas, tono calmado y tecnológico. ";
  const safe = (prefix + text).replace(/"/g, "'").slice(0, 800);

  return new Promise((resolve, reject) => {
    const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Rate = 0; $s.Speak("${safe}")`;
    const child = spawn("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", () => resolve());
  });
}
