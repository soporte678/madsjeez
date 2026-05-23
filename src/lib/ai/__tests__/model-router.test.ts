import { describe, expect, it } from "vitest";
import {
  expectedTierForTestMessage,
  selectModelForMessage,
  shouldEscalateTo14B,
} from "@/lib/ai/model-router";

const ROUTER_CASES = [
  { message: "Hola, está disponible?", expected: "marketplace" as const },
  { message: "Precio?", expected: "marketplace" as const },
  { message: "Tenés carburador para motoguadaña 52cc?", expected: "closer" as const },
  { message: "Está caro", expected: "closer" as const },
  { message: "Necesito una web para vender mis productos", expected: "closer" as const },
  { message: "Cuánto sale el envío a Morón?", expected: "marketplace" as const },
];

describe("model-router selection (6 spec cases)", () => {
  for (const { message, expected } of ROUTER_CASES) {
    it(`routes "${message}" → ${expected}`, () => {
      const tier = expectedTierForTestMessage(message);
      expect(tier).toBe(expected);
    });
  }
});

describe("shouldEscalateTo14B", () => {
  it("escalates on low confidence", () => {
    const r = shouldEscalateTo14B({
      message: "Precio?",
      marketplace: {
        respuesta_cliente: "Contame más",
        accion_recomendada: "calificar",
        dato_faltante: "",
        etapa_lead: "new",
        confianza: 0.5,
        debe_escalar_14b: false,
        motivo_escalamiento: "",
        etiquetas: [],
      },
    });
    expect(r.escalate).toBe(true);
    expect(r.reason).toBe("low_confidence");
  });

  it("escalates on technical keywords", () => {
    const r = shouldEscalateTo14B({
      message: "Sirve para motoguadaña 52cc?",
    });
    expect(r.escalate).toBe(true);
  });
});

describe("selectModelForMessage with classifier hint", () => {
  it("uses classifier 14b recommendation", () => {
    const sel = selectModelForMessage({
      message: "Hola",
      classifier: {
        rubro: "marketplace",
        intencion: "consulta",
        complejidad: "alta",
        etapa_lead: "new",
        requiere_14b: true,
        modelo_recomendado: "14b",
        motivo: "test",
        confianza: 0.9,
      },
    });
    expect(sel.tier).toBe("closer");
  });
});
