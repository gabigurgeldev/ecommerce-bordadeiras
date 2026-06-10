import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/cart";

describe("useCartStore", () => {
  beforeEach(() => {
    useCartStore.setState({
      lines: [],
      couponCode: null,
      syncedUserId: null,
      syncEpoch: 0,
    });
  });

  it("adds items and calculates subtotal", () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: "p1",
      slug: "produto-1",
      name: "Produto 1",
      priceCents: 2500,
      imageUrl: "/a.jpg",
      quantity: 2,
    });

    expect(useCartStore.getState().itemCount()).toBe(2);
    expect(useCartStore.getState().subtotalCents()).toBe(5000);
  });

  it("increments quantity for same product", () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: "p1",
      slug: "produto-1",
      name: "Produto 1",
      priceCents: 1000,
      imageUrl: "/a.jpg",
    });
    store.addItem({
      productId: "p1",
      slug: "produto-1",
      name: "Produto 1",
      priceCents: 1000,
      imageUrl: "/a.jpg",
    });

    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  it("clearCart increments syncEpoch", () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: "p1",
      slug: "produto-1",
      name: "Produto 1",
      priceCents: 1000,
      imageUrl: "/a.jpg",
    });
    store.clearCart();
    expect(useCartStore.getState().lines).toHaveLength(0);
    expect(useCartStore.getState().syncEpoch).toBe(1);
  });

  it("removes item when quantity goes below 1", () => {
    const store = useCartStore.getState();
    store.addItem({
      productId: "p1",
      slug: "produto-1",
      name: "Produto 1",
      priceCents: 1000,
      imageUrl: "/a.jpg",
    });
    const lineId = useCartStore.getState().lines[0].lineId;
    store.setQuantity(lineId, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });
});
