import { describe, it, expect } from "vitest";
import {
  cartLinesEqual,
  cartLinesSignature,
  mergeCartLines,
} from "@/lib/data/cart-merge";
import type { CartLine } from "@/store/cart";

const line = (
  overrides: Partial<CartLine> & Pick<CartLine, "lineId" | "productId">,
): CartLine => ({
  slug: "produto",
  name: "Produto",
  priceCents: 1000,
  imageUrl: "/img.jpg",
  quantity: 1,
  ...overrides,
});

describe("mergeCartLines", () => {
  it("merges guest and server keeping higher quantity", () => {
    const guest = [
      line({
        lineId: "line-p1",
        productId: "p1",
        quantity: 3,
        name: "Guest Name",
      }),
    ];
    const server = [
      line({
        lineId: "line-p1",
        productId: "p1",
        quantity: 1,
        name: "Server Name",
      }),
    ];

    const merged = mergeCartLines(guest, server);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(3);
    expect(merged[0].name).toBe("Server Name");
  });

  it("includes lines only in guest cart", () => {
    const guest = [line({ lineId: "line-p2", productId: "p2" })];
    const merged = mergeCartLines(guest, []);
    expect(merged).toHaveLength(1);
    expect(merged[0].productId).toBe("p2");
  });
});

describe("cartLinesSignature", () => {
  it("ignores display-only field changes", () => {
    const a = [line({ lineId: "line-p1", productId: "p1", name: "A" })];
    const b = [line({ lineId: "line-p1", productId: "p1", name: "B", priceCents: 2000 })];
    expect(cartLinesEqual(a, b)).toBe(true);
    expect(cartLinesSignature(a)).toBe(cartLinesSignature(b));
  });

  it("detects quantity changes", () => {
    const a = [line({ lineId: "line-p1", productId: "p1", quantity: 1 })];
    const b = [line({ lineId: "line-p1", productId: "p1", quantity: 2 })];
    expect(cartLinesEqual(a, b)).toBe(false);
  });
});
