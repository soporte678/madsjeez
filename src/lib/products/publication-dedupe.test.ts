import { describe, expect, it } from "vitest";
import { findPublicationDuplicateGroups, publicationMatchScore } from "./publication-dedupe";

describe("publication-dedupe", () => {
  it("coinciden título y precio (2 de 3)", () => {
    const a = { id: "a", title: "Taladro X", sku: "A1", price: 1000 };
    const b = { id: "b", title: "taladro x", sku: "B2", price: 1000 };
    expect(publicationMatchScore(a, b)).toBe(2);
  });

  it("agrupa duplicados y conserva el de más ventas", () => {
    const groups = findPublicationDuplicateGroups([
      { id: "1", title: "Producto", sku: "SKU-1", price: 500, sales: 10, meliItemId: "MLA1" },
      { id: "2", title: "producto", sku: "SKU-2", price: 500, sales: 0 },
      { id: "3", title: "Otro", sku: "X", price: 100 },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.keepId).toBe("1");
    expect(groups[0]!.removeIds).toEqual(["2"]);
  });
});
