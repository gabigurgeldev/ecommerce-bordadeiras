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

describe("mpIdempotencyKey", () => {
  it("builds stable keys per order and method", async () => {
    const { mpIdempotencyKey } = await import("@/lib/payments/mp-idempotency");
    expect(mpIdempotencyKey("order-1", "pix")).toBe("checkout-order-1-pix");
    expect(mpIdempotencyKey("order-1", "pix")).toBe(
      mpIdempotencyKey("order-1", "pix"),
    );
  });
});
