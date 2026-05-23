import { prisma } from "@/lib/prisma";
import type { JarvisModelTier } from "@/jarvis/jarvis-env";

export type JarvisAiLogInput = {
  command?: string;
  scope?: string;
  tier: JarvisModelTier;
  model: string;
  reason: string;
  latencyMs: number;
  escalatedTo14b?: boolean;
  promptTokensEstimate?: number;
};

export function saveJarvisAiLog(input: JarvisAiLogInput): void {
  void (async () => {
    try {
      await prisma.jarvisAiLog.create({
        data: {
          command: input.command ?? null,
          scope: input.scope ?? null,
          tier: input.tier,
          model: input.model,
          reason: input.reason,
          latencyMs: input.latencyMs,
          escalatedTo14b: input.escalatedTo14b ?? false,
          promptTokensEstimate: input.promptTokensEstimate ?? null,
        },
      });
    } catch {
      // fire-and-forget — Jarvis must not block on logging
    }
  })();
}
