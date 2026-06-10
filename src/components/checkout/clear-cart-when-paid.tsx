"use client";

import { fetchUserOrder } from "@/actions/orders";
import { clearServerCart } from "@/actions/cart";
import { isPaidOrderStatus } from "@/lib/order-status";
import { useCartStore } from "@/store/cart";
import { useEffect, useRef } from "react";

const POLL_MS = 8000;

export function ClearCartWhenPaid({ orderId }: { orderId: string }) {
  const clearCart = useCartStore((s) => s.clearCart);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;

    async function tryClear() {
      const order = await fetchUserOrder(orderId);
      if (!order || !isPaidOrderStatus(order.status)) return false;

      cleared.current = true;
      clearCart();
      await clearServerCart();
      return true;
    }

    void tryClear();

    const interval = setInterval(() => {
      if (cleared.current) {
        clearInterval(interval);
        return;
      }
      void tryClear().then((done) => {
        if (done) clearInterval(interval);
      });
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [orderId, clearCart]);

  return null;
}
