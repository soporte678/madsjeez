import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import { routeCommand } from "./commands/command-router.js";
import { handleVoiceStop } from "./voice/voice-router.js";
import { speakText } from "./voice/tts.js";
import { writeAgentTask } from "./integrations/agent-task-writer.js";
import type { DesktopCommandInput } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VOICE_HTML_PATH = resolve(__dirname, "..", "public", "voice.html");

function checkSecret(req: IncomingMessage): boolean {
  if (!config.secret || config.secret === "change-me") {
    console.warn("[atlas-desktop] Usá JARVIS_DESKTOP_SECRET distinto de change-me");
  }
  const h = req.headers["x-jarvis-secret"];
  return h === config.secret;
}

async function readJson<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw || "{}") as T;
}

function json(res: ServerResponse, status: number, body: unknown, req?: IncomingMessage) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (req) applyCors(req, res, headers);
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

/** CORS for admin web → local desktop bridge (Chrome Private Network Access). */
function applyCors(req: IncomingMessage, res: ServerResponse, headers: Record<string, string>): void {
  const origin = req.headers.origin;
  const allowed =
    origin &&
    (/^https:\/\/(www\.)?madsjeez\.com\.ar$/i.test(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin));
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type, x-jarvis-secret";
    headers["Access-Control-Allow-Private-Network"] = "true";
  }
}

function handleOptions(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method !== "OPTIONS") return false;
  const headers: Record<string, string> = {};
  applyCors(req, res, headers);
  res.writeHead(204, headers);
  res.end();
  return true;
}

function serveVoicePanel(res: ServerResponse): void {
  if (!existsSync(VOICE_HTML_PATH)) {
    return json(res, 404, { error: "voice.html not found" });
  }
  const html = readFileSync(VOICE_HTML_PATH, "utf8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

/** Rutas públicas en localhost: panel de micrófono (el POST sigue autenticado). */
function isPublicRoute(method: string, url: string): boolean {
  return method === "GET" && (url === "/voice" || url === "/voice/");
}

export function startServer(): void {
  const server = createServer(async (req, res) => {
    if (handleOptions(req, res)) return;

    const url = req.url?.split("?")[0] ?? "/";
    const method = req.method ?? "GET";

    if (isPublicRoute(method, url)) {
      return serveVoicePanel(res);
    }

    if (!checkSecret(req)) {
      return json(res, 401, { error: "Unauthorized" }, req);
    }

    try {
      if (method === "GET" && url === "/health") {
        return json(res, 200, {
          status: "ok",
          agent: "atlas-desktop",
          version: config.version,
          readOnly: config.readOnly,
          voiceProfile: config.voiceProfile,
          pushToTalk: config.pushToTalk,
          voicePanelUrl: `http://${config.host}:${config.port}/voice`,
        }, req);
      }

      if (method === "POST" && url === "/command") {
        const body = await readJson<DesktopCommandInput>(req);
        const result = await routeCommand(body);
        return json(res, 200, result, req);
      }

      if (method === "POST" && url === "/voice/start") {
        return json(res, 200, {
          status: "ok",
          mode: config.pushToTalk ? "push_to_talk" : "disabled",
          voicePanelUrl: `http://${config.host}:${config.port}/voice`,
          hint: "Abrí /voice en Chrome/Edge o enviá transcript a POST /voice/stop",
        }, req);
      }

      if (method === "POST" && url === "/voice/stop") {
        const body = await readJson<{ text: string }>(req);
        const result = await handleVoiceStop(body.text ?? "");
        return json(res, 200, result, req);
      }

      if (method === "POST" && url === "/speak") {
        const body = await readJson<{ text: string }>(req);
        await speakText(body.text ?? "");
        return json(res, 200, { status: "ok" }, req);
      }

      if (method === "POST" && url === "/agent-task") {
        const body = await readJson<{ agent: string; objective: string }>(req);
        const agent = (body.agent || "cursor") as "cursor" | "claude" | "windsurf" | "codex";
        const path = await writeAgentTask(agent, body.objective || "Tarea Atlas");
        return json(res, 200, { status: "ok", path }, req);
      }

      json(res, 404, { error: "Not found" }, req);
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "error" }, req);
    }
  });

  server.listen(config.port, config.host, () => {
    const secretHint =
      !config.secret || config.secret === "change-me"
        ? "change-me (¡editá .env y reiniciá!)"
        : `configurado (${config.secret.length} caracteres)`;
    console.log(`[atlas-desktop] http://${config.host}:${config.port} (readOnly=${config.readOnly})`);
    console.log(`[atlas-desktop] Secreto: ${secretHint}`);
    console.log(`[atlas-desktop] Voz (mic): http://${config.host}:${config.port}/voice`);
  });
}
