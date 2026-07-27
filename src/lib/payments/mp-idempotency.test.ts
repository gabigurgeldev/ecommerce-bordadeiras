import { describe, expect, it } from "vitest";
import { mpIdempotencyKey } from "@/lib/payments/mp-idempotency";

describe("mpIdempotencyKey", () => {
  it("builds stable keys per order, method and amount", () => {
    expect(mpIdempotencyKey("order-1", "pix", 5000)).toBe(
      "checkout-order-1-pix-5000",
    );
    expect(mpIdempotencyKey("order-1", "pix", 5000)).toBe(
      mpIdempotencyKey("order-1", "pix", 5000),
    );
  });

  it("changes when the amount changes", () => {
    expect(mpIdempotencyKey("order-1", "pix", 5000)).not.toBe(
      mpIdempotencyKey("order-1", "pix", 7000),
    );
  });

  it("keeps the suffix and caps the length", () => {
    expect(mpIdempotencyKey("order-1", "card-visa", 5000, "tok123")).toBe(
      "checkout-order-1-card-visa-5000-tok123",
    );
    expect(
      mpIdempotencyKey("o".repeat(200), "pix", 5000).length,
    ).toBeLessThanOrEqual(150);
  });
});
