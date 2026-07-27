import { describe, expect, it } from "vitest";
import { isMpTestUserEmail } from "@/lib/mercadopago-errors";

describe("sandbox payer email policy", () => {
  it("accepts official MP test user emails", () => {
    expect(isMpTestUserEmail("test_user_123@testuser.com")).toBe(true);
  });

  it("rejects invented testuser emails", () => {
    expect(isMpTestUserEmail("buyer@testuser.com")).toBe(false);
  });
});
