import { describe, expect, it } from "vitest";
import {
  checkImportDuplicate,
  createSellerDedupeIndex,
  normalizeImportSku,
  normalizeImportTitle,
  registerProductInDedupeIndex,
} from "./dedupe";

describe("meli dedupe", () => {
  it("normaliza título sin acentos y espacios extra", () => {
    expect(normalizeImportTitle("  BuJía   NGK  ")).toBe("bujia ngk");
  });

  it("rechaza segundo ítem con mismo título en el lote", () => {
    const index = createSellerDedupeIndex([]);
    registerProductInDedupeIndex(index, "p1", "Producto A", "SKU-1");
    const dup = checkImportDuplicate(index, "producto a", "SKU-2");
    expect(dup.duplicate).toBe(true);
    if (dup.duplicate) expect(dup.reason).toMatch(/t[ií]tulo/i);
  });

  it("rechaza SKU duplicado en catálogo existente", () => {
    const index = createSellerDedupeIndex([
      { id: "existing", title: "Otro nombre", sku: "ABC-123" },
    ]);
    const dup = checkImportDuplicate(index, "Nuevo título", "abc-123");
    expect(dup.duplicate).toBe(true);
    if (dup.duplicate) expect(dup.reason).toMatch(/SKU/i);
  });

  it("permite actualizar el mismo producto por id", () => {
    const index = createSellerDedupeIndex([
      { id: "p1", title: "Producto A", sku: "SKU-1" },
    ]);
    const dup = checkImportDuplicate(index, "Producto A", "SKU-1", "p1");
    expect(dup.duplicate).toBe(false);
  });

  it("ignora SKU vacío", () => {
    expect(normalizeImportSku("  ")).toBeNull();
    const index = createSellerDedupeIndex([]);
    const dup = checkImportDuplicate(index, "Solo título", null);
    expect(dup.duplicate).toBe(false);
  });
});
