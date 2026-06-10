"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLineInput } from "@/lib/types/catalog";

export type CartLine = CartLineInput & { lineId: string };

type CartState = {
  lines: CartLine[];
  couponCode: string | null;
  syncedUserId: string | null;
  syncEpoch: number;
  addItem: (item: Omit<CartLineInput, "quantity"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  setLines: (lines: CartLine[]) => void;
  clearCart: () => void;
  applyCoupon: (code: string | null) => void;
  setSyncedUserId: (userId: string | null) => void;
  itemCount: () => number;
  subtotalCents: () => number;
};

function lineId(productId: string, variantId?: string) {
  return variantId ? `line-${productId}-${variantId}` : `line-${productId}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      syncedUserId: null,
      syncEpoch: 0,
      addItem: (item) => {
        const id = lineId(item.productId, item.variantId);
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
                variantId: item.variantId,
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
      setLines: (lines) => set({ lines }),
      clearCart: () =>
        set((state) => ({
          lines: [],
          couponCode: null,
          syncEpoch: state.syncEpoch + 1,
        })),
      applyCoupon: (code) => set({ couponCode: code }),
      setSyncedUserId: (userId) => set({ syncedUserId: userId }),
      itemCount: () =>
        get().lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: () =>
        get().lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
    }),
    { name: "bordadeiras-cart" },
  ),
);
