import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getJarvisConfig } from "@/jarvis/jarvis-env";
import { runJarvisHealthCheck } from "@/jarvis/jarvis-health";

export async function getJarvisDashboardStatus() {
  const config = getJarvisConfig();
  const health = await runJarvisHealthCheck();

  let recentTasks: unknown[] = [];
  try {
    const raw = await readFile(path.join(process.cwd(), ".agent-tasks", "task-history.json"), "utf8");
    recentTasks = (JSON.parse(raw) as unknown[]).slice(0, 10);
  } catch {
    recentTasks = [];
  }

  let dbTasks: unknown[] = [];
  let findings: unknown[] = [];
  let reports: unknown[] = [];
  try {
    [dbTasks, findings, reports] = await Promise.all([
      prisma.jarvisAgentTask.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.jarvisFinding.findMany({
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.jarvisReport.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, type: true, summary: true, createdAt: true } }),
    ]);
  } catch {
    // tables may not exist until migration
  }

  return {
    enabled: config.enabled,
    flags: {
      readOnly: config.readOnly,
      allowAgentTasks: config.allowAgentTasks,
      allowCodeChanges: config.allowCodeChanges,
      allowDeploy: config.allowDeploy,
      allowVoiceReports: config.allowVoiceReports,
      requireConfirmation: config.requireConfirmation,
    },
    models: {
      fast: config.modelFast,
      normal: config.modelNormal,
      smart: config.modelSmart,
    },
    health,
    recentTasks,
    dbTasks,
    openFindings: findings,
    recentReports: reports,
    agents: ["cursor", "claude", "windsurf", "codex"],
    taskDir: ".agent-tasks/",
  };
}
