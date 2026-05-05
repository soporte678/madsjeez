import { describe, it, expect } from "vitest";
import { createMpOAuthState, verifyMpOAuthState } from "../mp-oauth-state";

describe("mp-oauth-state", () => {
  const secret = "a".repeat(32);

  it("round-trips valid state", () => {
    const state = createMpOAuthState("seller-uuid-123", secret);
    const parsed = verifyMpOAuthState(state, secret);
    expect(parsed).not.toBeNull();
    expect(parsed!.sellerUserId).toBe("seller-uuid-123");
    expect(parsed!.nonce).toHaveLength(32);
  });

  it("rejects tampered state", () => {
    const state = createMpOAuthState("user-1", secret);
    const tampered = state.slice(0, -4) + "xxxx";
    expect(verifyMpOAuthState(tampered, secret)).toBeNull();
  });

  it("rejects wrong secret", () => {
    const state = createMpOAuthState("user-1", secret);
    expect(verifyMpOAuthState(state, "b".repeat(32))).toBeNull();
  });
});
