import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { config } from "./config.js";
import { routeCommand } from "./commands/command-router.js";
import { handleVoiceStop } from "./voice/voice-router.js";
import { speakText } from "./voice/tts.js";
import { writeAgentTask } from "./integrations/agent-task-writer.js";
import type { DesktopCommandInput } from "./types.js";

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

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

export function startServer(): void {
  const server = createServer(async (req, res) => {
    if (!checkSecret(req)) {
      return json(res, 401, { error: "Unauthorized" });
    }

    const url = req.url ?? "/";
    const method = req.method ?? "GET";

    try {
      if (method === "GET" && url === "/health") {
        return json(res, 200, {
          status: "ok",
          agent: "atlas-desktop",
          version: config.version,
          readOnly: config.readOnly,
          voiceProfile: config.voiceProfile,
          pushToTalk: config.pushToTalk,
        });
      }

      if (method === "POST" && url === "/command") {
        const body = await readJson<DesktopCommandInput>(req);
        const result = await routeCommand(body);
        return json(res, 200, result);
      }

      if (method === "POST" && url === "/voice/start") {
        return json(res, 200, {
          status: "ok",
          mode: config.pushToTalk ? "push_to_talk" : "disabled",
          hint: "Enviá transcript a POST /voice/stop",
        });
      }

      if (method === "POST" && url === "/voice/stop") {
        const body = await readJson<{ text: string }>(req);
        const result = await handleVoiceStop(body.text ?? "");
        return json(res, 200, result);
      }

      if (method === "POST" && url === "/speak") {
        const body = await readJson<{ text: string }>(req);
        await speakText(body.text ?? "");
        return json(res, 200, { status: "ok" });
      }

      if (method === "POST" && url === "/agent-task") {
        const body = await readJson<{ agent: string; objective: string }>(req);
        const agent = (body.agent || "cursor") as "cursor" | "claude" | "windsurf" | "codex";
        const path = await writeAgentTask(agent, body.objective || "Tarea Atlas");
        return json(res, 200, { status: "ok", path });
      }

      json(res, 404, { error: "Not found" });
    } catch (e) {
      json(res, 500, { error: e instanceof Error ? e.message : "error" });
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(`[atlas-desktop] http://${config.host}:${config.port} (readOnly=${config.readOnly})`);
  });
}
