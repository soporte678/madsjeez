import { describe, expect, it } from "vitest";
import { resolveMeliScrollMaxPages, MELI_SCROLL_MAX_PAGES_SAFETY } from "./import-scroll";

describe("resolveMeliScrollMaxPages", () => {
  it("0 o all recorre hasta el tope de seguridad", () => {
    expect(resolveMeliScrollMaxPages(0)).toBe(MELI_SCROLL_MAX_PAGES_SAFETY);
    expect(resolveMeliScrollMaxPages("all")).toBe(MELI_SCROLL_MAX_PAGES_SAFETY);
    expect(resolveMeliScrollMaxPages(-1)).toBe(MELI_SCROLL_MAX_PAGES_SAFETY);
  });

  it("importAll fuerza recorrido completo", () => {
    expect(resolveMeliScrollMaxPages(5, { importAll: true })).toBe(MELI_SCROLL_MAX_PAGES_SAFETY);
  });

  it("acota páginas numéricas al máximo", () => {
    expect(resolveMeliScrollMaxPages(999)).toBe(MELI_SCROLL_MAX_PAGES_SAFETY);
    expect(resolveMeliScrollMaxPages(20)).toBe(20);
  });
});
