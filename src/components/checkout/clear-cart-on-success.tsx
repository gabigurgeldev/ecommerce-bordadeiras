"use client";

import { clearServerCart } from "@/actions/cart";
import { useCartStore } from "@/store/cart";
import { useEffect, useRef } from "react";

export function ClearCartOnSuccess() {
  const clearCart = useCartStore((s) => s.clearCart);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    async function run() {
      clearCart();
      await clearServerCart();
    }

    void run();
  }, [clearCart]);

  return null;
}
