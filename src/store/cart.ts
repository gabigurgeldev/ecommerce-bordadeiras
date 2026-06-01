"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineInput } from "@/lib/types/catalog";

export type CartLine = CartLineInput & { lineId: string };

type CartState = {
  lines: CartLine[];
  couponCode: string | null;
  addItem: (item: Omit<CartLineInput, "quantity"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string | null) => void;
  itemCount: () => number;
  subtotalCents: () => number;
};

function lineId(productId: string) {
  return `line-${productId}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      addItem: (item) => {
        const id = lineId(item.productId);
        const qty = item.quantity ?? 1;
        set((state) => {
          const existing = state.lines.find((l) => l.lineId === id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.lineId === id
                  ? { ...l, quantity: l.quantity + qty }
                  : l,
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                lineId: id,
                productId: item.productId,
                slug: item.slug,
                name: item.name,
                priceCents: item.priceCents,
                imageUrl: item.imageUrl,
                quantity: qty,
              },
            ],
          };
        });
      },
      removeItem: (lineId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.lineId !== lineId),
        })),
      setQuantity: (lineId, quantity) => {
        if (quantity < 1) {
          get().removeItem(lineId);
          return;
        }
        set((state) => ({
          lines: state.lines.map((l) =>
            l.lineId === lineId ? { ...l, quantity } : l,
          ),
        }));
      },
      clearCart: () => set({ lines: [], couponCode: null }),
      applyCoupon: (code) => set({ couponCode: code }),
      itemCount: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: () =>
        get().lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
    }),
    { name: "bordadeiras-cart" },
  ),
);
