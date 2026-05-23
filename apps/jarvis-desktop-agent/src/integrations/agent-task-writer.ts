import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { config } from "../config.js";

export async function writeAgentTask(agent: "cursor" | "claude" | "windsurf" | "codex", objective: string): Promise<string> {
  mkdirSync(config.tasksDir, { recursive: true });
  const file = join(config.tasksDir, `${agent}-task.md`);
  const now = new Date().toISOString();
  const md = `# Atlas → ${agent.toUpperCase()}

> ${now} | Desktop Agent

## Objetivo
${objective}

## Restricciones
- No tocar secretos
- No deploy sin confirmación
- No romper bot WhatsApp

## Verificación
- Lint/typecheck en archivos tocados
`;
  writeFileSync(file, md, "utf8");

  const historyPath = join(config.tasksDir, "task-history.json");
  let history: unknown[] = [];
  try {
    if (existsSync(historyPath)) history = JSON.parse(readFileSync(historyPath, "utf8")) as unknown[];
  } catch {
    history = [];
  }
  history.unshift({ agent, path: `.agent-tasks/${agent}-task.md`, objective, createdAt: now, source: "desktop" });
  writeFileSync(historyPath, JSON.stringify(history.slice(0, 100), null, 2), "utf8");

  return `.agent-tasks/${agent}-task.md`;
}
