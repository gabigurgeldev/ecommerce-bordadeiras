import { beforeEach, describe, expect, it, vi } from "vitest";

const productRow = {
  id: "prod-1",
  name: "Toalha bordada",
  sku: "TB-1",
  priceCents: 5000,
  stock: 5,
  stockUnlimited: false,
  active: true,
  status: "ACTIVE",
  weightGrams: 300,
  lengthCm: 20,
  widthCm: 15,
  heightCm: 5,
  shippingMode: "CORREIOS",
  fixedShippingCents: null,
};

const from = vi.fn();
vi.mock("@/lib/supabase/db", () => ({
  getDb: () => ({ from }),
  TABLES: { Product: "Product", ProductVariant: "ProductVariant" },
}));

function mockProductQuery(rows: Record<string, unknown>[]) {
  from.mockReturnValue({
    select: () => ({
      in: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: rows, error: null }),
        }),
      }),
    }),
  });
}

describe("resolveCheckoutLineItems", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("rejects duplicate lines whose combined quantity exceeds stock", async () => {
    mockProductQuery([productRow]);
    const { resolveCheckoutLineItems } = await import("@/lib/checkout-items");

    const result = await resolveCheckoutLineItems([
      { productId: "prod-1", quantity: 5 },
      { productId: "prod-1", quantity: 5 },
    ]);

    expect(result.ok).toBe(false);
  });

  it("merges duplicate lines into one item", async () => {
    mockProductQuery([productRow]);
    const { resolveCheckoutLineItems } = await import("@/lib/checkout-items");

    const result = await resolveCheckoutLineItems([
      { productId: "prod-1", quantity: 2 },
      { productId: "prod-1", quantity: 3 },
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].quantity).toBe(5);
  });

  it("does not mutate the caller's input", async () => {
    mockProductQuery([productRow]);
    const { resolveCheckoutLineItems } = await import("@/lib/checkout-items");

    const items = [
      { productId: "prod-1", quantity: 2 },
      { productId: "prod-1", quantity: 3 },
    ];
    await resolveCheckoutLineItems(items);

    expect(items.map((i) => i.quantity)).toEqual([2, 3]);
  });
});
