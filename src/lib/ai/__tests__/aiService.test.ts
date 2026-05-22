import { describe, expect, it } from "vitest";
import { detectIntent, shouldHandoffToHuman } from "../aiService";

describe("detectIntent (sales closer)", () => {
  it("detecta intención de compra fuerte", () => {
    const r = detectIntent("Dale, pasame el link que lo compro");
    expect(r.intent).toBe("compra");
    expect(r.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it("detecta objeción de precio", () => {
    expect(detectIntent("Está muy caro, no hay descuento?").intent).toBe("objecion_precio");
  });

  it("detecta objeción de tiempo", () => {
    expect(detectIntent("Lo pienso y te escribo después").intent).toBe("objecion_tiempo");
  });

  it("detecta objeción de competencia", () => {
    expect(detectIntent("En MercadoLibre vi más barato").intent).toBe("objecion_competencia");
  });

  it("deriva reclamos a humano", () => {
    const h = shouldHandoffToHuman({
      message: "Quiero hacer un reclamo por la devolución",
      intent: "reclamo",
      confidence: 0.95,
      humanHandoffEnabled: true,
    });
    expect(h.shouldHandoff).toBe(true);
  });
});
