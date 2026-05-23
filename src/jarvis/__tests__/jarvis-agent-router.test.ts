import { describe, expect, it } from "vitest";
import { routeTaskToAgents, agentDisplayName } from "@/jarvis/jarvis-agent-router";

describe("jarvis-agent-router", () => {
  it("routes refactor repo work to cursor", () => {
    const routes = routeTaskToAgents({
      objective: "Refactor TypeScript components in Next.js repo",
      scope: "repo",
      detail: "normal",
    });
    expect(routes[0]?.agent).toBe("cursor");
  });

  it("routes security audit to claude", () => {
    const routes = routeTaskToAgents({
      objective: "Auditoría de seguridad y arquitectura CEO",
      scope: "all",
      detail: "full",
    });
    expect(routes.some((r) => r.agent === "claude")).toBe(true);
  });

  it("routes n8n automation to windsurf", () => {
    const routes = routeTaskToAgents({
      objective: "Completar workflow n8n para leads async",
      scope: "n8n",
      detail: "normal",
    });
    expect(routes[0]?.agent).toBe("windsurf");
  });

  it("routes scripts to codex", () => {
    const routes = routeTaskToAgents({
      objective: "Crear script CLI benchmark Ollama",
      scope: "ollama",
      detail: "normal",
    });
    expect(routes[0]?.agent).toBe("codex");
  });

  it("explicit all returns 4 agents", () => {
    const routes = routeTaskToAgents({
      objective: "test",
      scope: "all",
      detail: "normal",
      explicitTarget: "all",
    });
    expect(routes).toHaveLength(4);
  });

  it("agent display names", () => {
    expect(agentDisplayName("claude")).toBe("Claude Code");
  });
});
