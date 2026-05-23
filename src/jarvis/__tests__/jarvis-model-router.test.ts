import { describe, expect, it } from "vitest";
import {
  applyClassifierToSelection,
  parseJarvisClassifier,
  selectJarvisModel,
  selectJarvisModelRulesOnly,
} from "@/jarvis/jarvis-model-router";

describe("jarvis-model-router rules (no Ollama)", () => {
  it("health short → fast, skip LLM", () => {
    const sel = selectJarvisModelRulesOnly("health", "all", "short");
    expect(sel.tier).toBe("fast");
    expect(sel.skipLlm).toBe(true);
  });

  it("audit-marketplace normal → normal", () => {
    const sel = selectJarvisModelRulesOnly("audit-marketplace", "marketplace", "normal");
    expect(sel.tier).toBe("normal");
    expect(sel.skipLlm).toBe(false);
  });

  it("audit-marketplace full → smart", () => {
    const sel = selectJarvisModelRulesOnly("audit-marketplace", "marketplace", "full");
    expect(sel.tier).toBe("smart");
  });

  it("audit repo scope → smart", () => {
    const sel = selectJarvisModelRulesOnly("audit-marketplace", "repo", "normal");
    expect(sel.tier).toBe("smart");
  });

  it("detect-errors with critical → smart", () => {
    const sel = selectJarvisModelRulesOnly("detect-errors", "whatsapp", "normal", {
      criticalFindings: true,
    });
    expect(sel.tier).toBe("smart");
  });

  it("suggest-improvements full → smart", () => {
    const sel = selectJarvisModelRulesOnly("suggest-improvements", "all", "full");
    expect(sel.tier).toBe("smart");
  });

  it("create-agent-task normal → normal", () => {
    const sel = selectJarvisModelRulesOnly("create-agent-task", "marketplace", "normal");
    expect(sel.tier).toBe("normal");
  });

  it("create-agent-task repo → smart", () => {
    const sel = selectJarvisModelRulesOnly("create-agent-task", "repo", "normal");
    expect(sel.tier).toBe("smart");
  });

  it("voice-report short → normal, skip LLM", () => {
    const sel = selectJarvisModelRulesOnly("voice-report", "all", "short");
    expect(sel.tier).toBe("normal");
    expect(sel.skipLlm).toBe(true);
  });
});

describe("parseJarvisClassifier", () => {
  it("parses tier and confidence", () => {
    const c = parseJarvisClassifier({
      tier: "smart",
      reason: "arquitectura",
      confidence: 0.92,
    });
    expect(c?.tier).toBe("smart");
    expect(c?.confidence).toBe(0.92);
  });
});

describe("selectJarvisModel with classifier", () => {
  it("merges classifier smart over normal rules when confident", () => {
    const rules = selectJarvisModelRulesOnly("audit-marketplace", "marketplace", "normal");
    const merged = applyClassifierToSelection(rules, {
      tier: "smart",
      reason: "ceo_strategy",
      confidence: 0.9,
    });
    expect(merged.tier).toBe("smart");
  });

  it("router disabled forces smart legacy", () => {
    const prev = process.env.JARVIS_MODEL_ROUTER_ENABLED;
    process.env.JARVIS_MODEL_ROUTER_ENABLED = "false";
    const sel = selectJarvisModel({
      command: "health",
      scope: "all",
      detail: "short",
    });
    expect(sel.tier).toBe("smart");
    expect(sel.reason).toContain("router_disabled");
    if (prev === undefined) delete process.env.JARVIS_MODEL_ROUTER_ENABLED;
    else process.env.JARVIS_MODEL_ROUTER_ENABLED = prev;
  });
});
