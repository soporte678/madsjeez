#!/usr/bin/env node
/**
 * Jarvis local dispatch — lee .agent-tasks/ y opcionalmente lanza Cursor SDK.
 *
 * Uso:
 *   node scripts/jarvis-dispatch.mjs
 *   node scripts/jarvis-dispatch.mjs --agent cursor --path .agent-tasks/cursor-task.md
 *   JARVIS_AUTO_DISPATCH=true node scripts/jarvis-dispatch.mjs --all
 */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const all = args.includes("--all");
const agentIdx = args.indexOf("--agent");
const pathIdx = args.indexOf("--path");

async function loadHistory() {
  const raw = await readFile(path.join(root, ".agent-tasks", "task-history.json"), "utf8");
  return JSON.parse(raw);
}

async function dispatchCursor(objective, taskMd) {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey || process.env.JARVIS_CURSOR_DISPATCH !== "true") {
    console.log("[jarvis] Cursor manual:", path.join(root, ".agent-tasks/cursor-task.md"));
    return;
  }
  try {
    const { Agent } = await import("@cursor/sdk");
    const result = await Agent.prompt(`${objective}\n\n${taskMd.slice(0, 12000)}`, {
      apiKey,
      model: { id: process.env.JARVIS_CURSOR_MODEL || "composer-2.5" },
      local: { cwd: root },
    });
    console.log("[jarvis] Cursor:", result.status, result.id ?? "");
  } catch (e) {
    console.warn("[jarvis] Cursor SDK:", e.message);
    console.log("Instalá: npm i @cursor/sdk");
  }
}

async function main() {
  if (agentIdx >= 0 && pathIdx >= 0) {
    const agent = args[agentIdx + 1];
    const taskPath = args[pathIdx + 1];
    const md = await readFile(path.join(root, taskPath), "utf8");
    if (agent === "cursor") await dispatchCursor("Jarvis task", md);
    else console.log(`[jarvis] Abrí ${taskPath} en ${agent}`);
    return;
  }

  const history = await loadHistory();
  const entries = all ? history.slice(0, 4) : history.slice(0, 1);
  for (const entry of entries) {
    if (!entry.path) continue;
    const md = await readFile(path.join(root, entry.path), "utf8");
    console.log(`\n--- ${entry.agent} ${entry.path} ---`);
    if (entry.agent === "cursor") await dispatchCursor(entry.objective ?? "task", md);
    else console.log(`Pegá en ${entry.agent}:`, entry.path);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
