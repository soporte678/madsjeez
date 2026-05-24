import { spawn } from "child_process";
import { unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";
import { ttsSave } from "edge-tts";
import { config } from "../config.js";
import type { VoiceProfile } from "../types.js";

/** Voces neurales Edge — estilo asistente premium (sin clonar personajes reales). */
const EDGE_VOICES: Record<VoiceProfile, { voice: string; rate: string; pitch: string }> = {
  atlas: {
    voice: "es-AR-TomasNeural",
    rate: "-6%",
    pitch: "-4Hz",
  },
  nova: {
    voice: "es-AR-ElenaNeural",
    rate: "-3%",
    pitch: "+2Hz",
  },
};

function resolveEdgeOptions(profile: VoiceProfile) {
  const base = EDGE_VOICES[profile];
  const voiceOverride =
    profile === "nova"
      ? process.env.JARVIS_TTS_VOICE_NOVA?.trim()
      : process.env.JARVIS_TTS_VOICE_ATLAS?.trim();
  return {
    voice: voiceOverride || base.voice,
    rate: process.env.JARVIS_TTS_RATE?.trim() || base.rate,
    pitch: process.env.JARVIS_TTS_PITCH?.trim() || base.pitch,
  };
}

async function playMp3Windows(filePath: string): Promise<void> {
  const uri = filePath.replace(/\\/g, "/");
  const ps = `
Add-Type -AssemblyName presentationCore
$p = New-Object System.Windows.Media.MediaPlayer
$p.Open([uri]::new("file:///${uri}"))
$p.Volume = 1.0
$p.Play()
$sw = [Diagnostics.Stopwatch]::StartNew()
while ($p.NaturalDuration.HasTimeSpan -eq $false -and $sw.Elapsed.TotalSeconds -lt 15) {
  Start-Sleep -Milliseconds 80
}
if ($p.NaturalDuration.HasTimeSpan) {
  $ms = [int]($p.NaturalDuration.TimeSpan.TotalMilliseconds + 400)
  Start-Sleep -Milliseconds $ms
} else {
  Start-Sleep -Seconds 3
}
$p.Close()
`;
  return new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", () => resolve());
  });
}

async function speakEdgeNeural(text: string, profile: VoiceProfile): Promise<void> {
  const safe = text.replace(/\s+/g, " ").trim().slice(0, 1200);
  if (!safe) return;

  const id = randomBytes(6).toString("hex");
  const mp3 = join(tmpdir(), `atlas-tts-${id}.mp3`);
  const opts = resolveEdgeOptions(profile);

  try {
    await ttsSave(safe, mp3, opts);
    await playMp3Windows(mp3);
  } finally {
    await unlink(mp3).catch(() => undefined);
  }
}

/** Fallback: voces instaladas en Windows (menos fluidas). */
async function speakWindowsLegacy(text: string, profile: VoiceProfile): Promise<void> {
  const safe = text.replace(/"/g, "'").replace(/`/g, "'").slice(0, 800);
  const voiceName = profile === "nova" ? "Microsoft Sabina" : "Microsoft Pablo";
  const rate = profile === "nova" ? 0 : -1;
  const ps = `
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
foreach ($v in $s.GetInstalledVoices()) {
  if ($v.VoiceInfo.Name -like "*${voiceName}*") { $s.SelectVoice($v.VoiceInfo.Name); break }
}
$s.Rate = ${rate}
$s.Volume = 100
$s.Speak("${safe}")
`;
  return new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", () => resolve());
  });
}

/**
 * TTS fluido — Edge neural por defecto (Atlas ≈ asistente masculino calmado, Nova ≈ femenino profesional).
 */
export async function speakText(text: string, profile?: VoiceProfile): Promise<void> {
  const p = profile ?? config.voiceProfile;
  const provider = process.env.JARVIS_TTS_PROVIDER?.trim().toLowerCase() || "edge";

  if (provider === "windows") {
    return speakWindowsLegacy(text, p);
  }

  try {
    await speakEdgeNeural(text, p);
  } catch (e) {
    console.warn("[atlas-desktop] Edge TTS falló, usando voz Windows:", e instanceof Error ? e.message : e);
    await speakWindowsLegacy(text, p);
  }
}
