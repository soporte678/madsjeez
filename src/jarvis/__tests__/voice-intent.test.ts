import { describe, expect, it } from "vitest";
import { hasWakeWord, parseVoiceTranscript as parseWake } from "@/lib/jarvis/wake-word";
import { parseVoiceTranscript, routeVoiceCommand } from "@/lib/jarvis/voice-intent";

describe("wake-word", () => {
  it("detects Atlas variants", () => {
    expect(hasWakeWord("Atlas, estado del sistema")).toBe(true);
    expect(hasWakeWord("at las estado")).toBe(true);
    expect(hasWakeWord("hola mundo")).toBe(false);
  });

  it("rejects missing wake word when required", () => {
    const r = parseWake("estado del sistema", true);
    expect(r.ok).toBe(false);
  });
});

describe("voice-intent", () => {
  it("maps health phrase to web command", () => {
    const r = routeVoiceCommand("estado del sistema");
    expect(r.kind).toBe("web");
    if (r.kind === "web") expect(r.input.command).toBe("health");
  });

  it("maps open cursor to desktop", () => {
    const r = routeVoiceCommand("abrir cursor");
    expect(r.kind).toBe("desktop");
  });

  it("parseVoiceTranscript returns web route", () => {
    const route = parseVoiceTranscript("Atlas, estado del sistema", true);
    expect(route.kind).toBe("web");
    if (route.kind === "web") expect(route.path).toBe("/api/jarvis/command");
  });
});
