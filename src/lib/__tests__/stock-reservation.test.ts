import { describe, expect, it } from "vitest";
import {
  hasActiveStockReservation,
  markStockReleased,
  markStockReserved,
} from "../orders/stock-reservation";

describe("stock-reservation", () => {
  it("marks a shipping payload as having active reserved stock", () => {
    const reserved = markStockReserved({ city: "Buenos Aires" });

    expect(reserved.city).toBe("Buenos Aires");
    expect(typeof reserved.stock_reserved_at).toBe("string");
    expect(hasActiveStockReservation(reserved)).toBe(true);
  });

  it("does not treat released stock as an active reservation", () => {
    const reserved = markStockReserved({ address: "Av. Corrientes 123" });
    const released = markStockReleased(reserved);

    expect(typeof released.stock_reserved_at).toBe("string");
    expect(typeof released.stock_released_at).toBe("string");
    expect(hasActiveStockReservation(released)).toBe(false);
  });

  it("handles empty or invalid shipping payloads safely", () => {
    expect(hasActiveStockReservation(null)).toBe(false);
    expect(hasActiveStockReservation("")).toBe(false);
    expect(markStockReleased(null).stock_released_at).toEqual(expect.any(String));
  });
});
