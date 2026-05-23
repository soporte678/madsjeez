import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = resolve(__dirname, "..", ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k] || k.startsWith("JARVIS_") || k === "MARKETPLACE_API_URL" || k === "MARKETPLACE_JARVIS_SECRET") {
      process.env[k] = v;
    }
  }
}

loadEnvFile();

function bool(key: string, def: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return def;
  return v.toLowerCase() === "true";
}

export const config = {
  enabled: bool("JARVIS_DESKTOP_ENABLED", true),
  host: process.env.JARVIS_DESKTOP_HOST?.trim() || "127.0.0.1",
  port: parseInt(process.env.JARVIS_DESKTOP_PORT ?? "8787", 10),
  secret: process.env.JARVIS_DESKTOP_SECRET?.trim() || "change-me",
  readOnly: bool("JARVIS_READ_ONLY", true),
  requireConfirmation: bool("JARVIS_REQUIRE_CONFIRMATION", true),
  voiceProfile: (process.env.JARVIS_VOICE_PROFILE === "nova" ? "nova" : "atlas") as "atlas" | "nova",
  pushToTalk: bool("JARVIS_PUSH_TO_TALK", true),
  wakeWordEnabled: bool("JARVIS_WAKE_WORD_ENABLED", false),
  tasksDir: resolve(process.cwd(), process.env.JARVIS_AGENT_TASKS_DIR?.trim() || "../../.agent-tasks"),
  repoRoot: resolve(process.cwd(), process.env.JARVIS_REPO_ROOT?.trim() || "../.."),
  marketplaceUrl: (process.env.MARKETPLACE_API_URL?.trim() || "https://www.madsjeez.com.ar").replace(/\/+$/, ""),
  marketplaceSecret: process.env.MARKETPLACE_JARVIS_SECRET?.trim() || "",
  ollamaUrl: (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/+$/, ""),
  version: "0.1.0",
};
