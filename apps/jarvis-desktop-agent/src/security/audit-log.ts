import { appendFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import type { AuditEntry } from "../types.js";
import { config } from "../config.js";

const logPath = join(config.repoRoot, ".agent-tasks", "desktop-audit.log");

export function auditLog(entry: Omit<AuditEntry, "at">): void {
  const line: AuditEntry = { ...entry, at: new Date().toISOString() };
  try {
    if (!existsSync(dirname(logPath))) mkdirSync(dirname(logPath), { recursive: true });
    appendFileSync(logPath, JSON.stringify(line) + "\n", "utf8");
  } catch {
    // swallow
  }
}
