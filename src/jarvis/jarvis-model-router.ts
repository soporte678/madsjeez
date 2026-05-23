import type { JarvisCommand, JarvisDetail, JarvisScope } from "@/jarvis/types";
import {
  getJarvisRouterEnv,
  modelForJarvisTier,
  type JarvisModelTier,
} from "@/jarvis/jarvis-env";

export type JarvisClassifierResult = {
  tier: JarvisModelTier;
  reason: string;
  confidence: number;
};

export type JarvisModelSelection = {
  tier: JarvisModelTier;
  model: string;
  reason: string;
  confidence?: number;
  /** Skip Ollama entirely (deterministic path). */
  skipLlm: boolean;
};

const SMART_SCOPES = new Set<JarvisScope>(["repo", "railway"]);
const COMPLEX_SCOPES = new Set<JarvisScope>(["repo", "all"]);

function isSecurityOrArchitectureHint(message?: string): boolean {
  if (!message) return false;
  return /seguridad|security|arquitect|architecture|rls|auth|cve|vulnerab|estrateg|ceo|roadmap/i.test(
    message
  );
}

function ruleSelectJarvisModel(params: {
  command: JarvisCommand;
  scope: JarvisScope;
  detail: JarvisDetail;
  criticalFindings?: boolean;
  message?: string;
}): JarvisModelSelection {
  const { command, scope, detail, criticalFindings, message } = params;

  if (command === "health") {
    if (detail === "short") {
      return {
        tier: "fast",
        model: modelForJarvisTier("fast"),
        reason: "health_short_deterministic",
        skipLlm: true,
      };
    }
    return {
      tier: "fast",
      model: modelForJarvisTier("fast"),
      reason: "health_optional_3b_summary",
      skipLlm: false,
    };
  }

  if (command === "audit-marketplace") {
    if (detail === "full" || SMART_SCOPES.has(scope) || /security|seguridad/i.test(scope)) {
      return {
        tier: "smart",
        model: modelForJarvisTier("smart"),
        reason: "audit_full_or_high_risk_scope",
        skipLlm: false,
      };
    }
    return {
      tier: "normal",
      model: modelForJarvisTier("normal"),
      reason: "audit_marketplace_normal",
      skipLlm: false,
    };
  }

  if (command === "create-agent-task") {
    if (
      detail === "full" ||
      COMPLEX_SCOPES.has(scope) ||
      isSecurityOrArchitectureHint(message)
    ) {
      return {
        tier: "smart",
        model: modelForJarvisTier("smart"),
        reason: "agent_task_complex_scope",
        skipLlm: false,
      };
    }
    return {
      tier: "normal",
      model: modelForJarvisTier("normal"),
      reason: "agent_task_normal",
      skipLlm: false,
    };
  }

  if (command === "voice-report") {
    return {
      tier: "normal",
      model: modelForJarvisTier("normal"),
      reason: detail === "short" ? "voice_report_template_first" : "voice_report_narration",
      skipLlm: detail === "short",
    };
  }

  if (command === "detect-errors") {
    if (criticalFindings || detail === "full") {
      return {
        tier: "smart",
        model: modelForJarvisTier("smart"),
        reason: criticalFindings ? "critical_errors_escalated" : "errors_report_full",
        skipLlm: false,
      };
    }
    return {
      tier: "normal",
      model: modelForJarvisTier("normal"),
      reason: "detect_errors_normal",
      skipLlm: false,
    };
  }

  if (command === "suggest-improvements") {
    if (detail === "full" || isSecurityOrArchitectureHint(message)) {
      return {
        tier: "smart",
        model: modelForJarvisTier("smart"),
        reason: "improvements_full_or_strategic",
        skipLlm: false,
      };
    }
    return {
      tier: "normal",
      model: modelForJarvisTier("normal"),
      reason: "suggest_improvements_normal",
      skipLlm: false,
    };
  }

  return {
    tier: "normal",
    model: modelForJarvisTier("normal"),
    reason: "default_normal",
    skipLlm: false,
  };
}

export function parseJarvisClassifier(parsed: unknown): JarvisClassifierResult | null {
  const o = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const tierRaw = String(o.tier ?? "normal").toLowerCase();
  let tier: JarvisModelTier = "normal";
  if (tierRaw.includes("fast") || tierRaw.includes("3")) tier = "fast";
  else if (tierRaw.includes("smart") || tierRaw.includes("14")) tier = "smart";

  const confidence =
    typeof o.confidence === "number"
      ? Math.max(0, Math.min(1, o.confidence))
      : 0.5;

  return {
    tier,
    reason: typeof o.reason === "string" ? o.reason : "classifier_3b",
    confidence,
  };
}

export function applyClassifierToSelection(
  rules: JarvisModelSelection,
  classifier: JarvisClassifierResult
): JarvisModelSelection {
  const env = getJarvisRouterEnv();
  let tier = classifier.tier;

  if (env.escalateTo14b && classifier.tier === "smart") {
    tier = "smart";
  } else if (classifier.tier === "fast" && rules.tier !== "fast") {
    tier = rules.tier;
  } else if (classifier.confidence >= 0.75) {
    tier = classifier.tier;
  }

  const tierOrder: JarvisModelTier[] = ["fast", "normal", "smart"];
  const maxTier =
    tierOrder.indexOf(tier) > tierOrder.indexOf(rules.tier) ? tier : rules.tier;

  return {
    tier: maxTier,
    model: modelForJarvisTier(maxTier),
    reason: `${rules.reason}; classifier: ${classifier.reason}`,
    confidence: classifier.confidence,
    skipLlm: rules.skipLlm,
  };
}

export function selectJarvisModel(params: {
  command: JarvisCommand;
  scope?: JarvisScope;
  detail?: JarvisDetail;
  criticalFindings?: boolean;
  message?: string;
  classifier?: JarvisClassifierResult | null;
}): JarvisModelSelection {
  const scope = params.scope ?? "all";
  const detail = params.detail ?? "normal";
  const rules = ruleSelectJarvisModel({
    command: params.command,
    scope,
    detail,
    criticalFindings: params.criticalFindings,
    message: params.message,
  });

  if (!getJarvisRouterEnv().routerEnabled) {
    return {
      tier: "smart",
      model: modelForJarvisTier("smart"),
      reason: "router_disabled_legacy_smart",
      skipLlm: rules.skipLlm,
    };
  }

  if (params.classifier) {
    return applyClassifierToSelection(rules, params.classifier);
  }

  return rules;
}

export type ClassifyCommandInput = {
  command: JarvisCommand;
  scope?: JarvisScope;
  detail?: JarvisDetail;
  message?: string;
};

/** Rule-only tier for tests (no Ollama). */
export function selectJarvisModelRulesOnly(
  command: JarvisCommand,
  scope: JarvisScope = "all",
  detail: JarvisDetail = "normal",
  opts?: { criticalFindings?: boolean; message?: string }
): JarvisModelSelection {
  return ruleSelectJarvisModel({
    command,
    scope,
    detail,
    criticalFindings: opts?.criticalFindings,
    message: opts?.message,
  });
}

export async function classifyCommandWith3B(
  input: ClassifyCommandInput
): Promise<JarvisClassifierResult | null> {
  const env = getJarvisRouterEnv();
  if (!env.routerEnabled) return null;

  const { callJarvisOllama } = await import("@/jarvis/jarvis-ollama");
  const { extractJsonObject } = await import("@/lib/ai/ollama-json");
  const {
    JARVIS_COMMAND_CLASSIFIER_RETRY,
    JARVIS_COMMAND_CLASSIFIER_SYSTEM,
  } = await import("@/jarvis/prompts/command-classifier");

  const userPayload = JSON.stringify({
    command: input.command,
    scope: input.scope ?? "all",
    detail: input.detail ?? "normal",
    message: input.message?.slice(0, 400) ?? "",
  });

  try {
    const first = await callJarvisOllama({
      tier: "fast",
      format: "json",
      system: JARVIS_COMMAND_CLASSIFIER_SYSTEM,
      prompt: userPayload,
      maxTokens: env.numPredict.fast,
      command: input.command,
      scope: input.scope,
      reason: "command_classifier_3b",
    });

    let parsed = extractJsonObject(first.text);
    if (!parsed) {
      const retry = await callJarvisOllama({
        tier: "fast",
        format: "json",
        system: JARVIS_COMMAND_CLASSIFIER_SYSTEM,
        prompt: `${userPayload}\n\nAssistant JSON was invalid. ${JARVIS_COMMAND_CLASSIFIER_RETRY}`,
        maxTokens: env.numPredict.fast,
        command: input.command,
        scope: input.scope,
        reason: "command_classifier_retry",
        skipLog: true,
      });
      parsed = extractJsonObject(retry.text);
    }

    if (!parsed) return null;
    const base = parseJarvisClassifier(parsed);
    if (!base) return null;

    const o = parsed as Record<string, unknown>;
    if (env.escalateTo14b && Boolean(o.escalate_to_smart)) {
      return { ...base, tier: "smart", reason: base.reason || "escalate_to_smart" };
    }
    return base;
  } catch {
    return null;
  }
}

export async function resolveJarvisModelSelection(params: {
  command: JarvisCommand;
  scope?: JarvisScope;
  detail?: JarvisDetail;
  criticalFindings?: boolean;
  message?: string;
}): Promise<JarvisModelSelection> {
  const scope = params.scope ?? "all";
  const detail = params.detail ?? "normal";
  const rules = ruleSelectJarvisModel({
    command: params.command,
    scope,
    detail,
    criticalFindings: params.criticalFindings,
    message: params.message,
  });
  if (rules.skipLlm) return rules;

  const classifier = await classifyCommandWith3B({
    command: params.command,
    scope,
    detail,
    message: params.message,
  });
  return selectJarvisModel({ ...params, scope, detail, classifier });
}
