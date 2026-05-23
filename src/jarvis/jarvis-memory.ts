import { prisma } from "@/lib/prisma";
import type { JarvisFinding, JarvisReportType } from "@/jarvis/types";

export async function saveJarvisReport(input: {
  type: JarvisReportType | string;
  scope: string;
  summary: string;
  body: Record<string, unknown>;
}): Promise<string | undefined> {
  try {
    const row = await prisma.jarvisReport.create({
      data: {
        type: input.type,
        scope: input.scope,
        summary: input.summary,
        body: input.body,
      },
    });
    return row.id;
  } catch {
    return undefined;
  }
}

export async function saveJarvisFindings(findings: JarvisFinding[]): Promise<void> {
  if (findings.length === 0) return;
  try {
    await prisma.jarvisFinding.createMany({
      data: findings.map((f) => ({
        id: f.id,
        scope: f.scope,
        severity: f.severity,
        title: f.title,
        description: f.description,
        recommendedAction: f.recommendedAction ?? null,
        agentTarget: f.agentTarget ?? null,
        status: f.status,
      })),
      skipDuplicates: true,
    });
  } catch {
    // DB optional — Jarvis works without persistence
  }
}

export async function saveJarvisHealthCheck(payload: Record<string, unknown>): Promise<void> {
  try {
    await prisma.jarvisHealthCheck.create({
      data: { payload },
    });
  } catch {
    // ignore
  }
}

export async function saveJarvisAuditLog(action: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await prisma.jarvisAuditLog.create({
      data: { action, payload },
    });
  } catch {
    // ignore
  }
}

export async function saveJarvisVoiceReport(text: string, profile: string, audioUrl?: string): Promise<string | undefined> {
  try {
    const row = await prisma.jarvisVoiceReport.create({
      data: { text, profile, audioUrl: audioUrl ?? null },
    });
    return row.id;
  } catch {
    return undefined;
  }
}

export async function saveJarvisAgentTaskRecord(input: {
  agent: string;
  objective: string;
  filePath: string;
  status?: string;
}): Promise<void> {
  try {
    await prisma.jarvisAgentTask.create({
      data: {
        agent: input.agent,
        objective: input.objective,
        filePath: input.filePath,
        status: input.status ?? "open",
      },
    });
  } catch {
    // ignore
  }
}
