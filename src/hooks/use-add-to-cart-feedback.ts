"use client";

import type { CartLineInput } from "@/lib/types/catalog";
import { useCartStore } from "@/store/cart";
import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export type AddToCartItem = Omit<CartLineInput, "quantity"> & { quantity?: number };

const LOADING_MS = 300;
const SUCCESS_MS = 1200;

export function useAddToCartFeedback() {
  const addItem = useCartStore((s) => s.addItem);
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const busyRef = useRef(false);

  const showToast = useCallback(() => {
    toast.success("Produto adicionado à sacola", {
      action: {
        label: "Ver sacola",
        onClick: () => router.push("/sacola"),
      },
    });
  }, [router]);

  const addToCart = useCallback(
    async (item: AddToCartItem) => {
      if (busyRef.current) return;

      if (reduceMotion) {
        addItem(item);
        showToast();
        return;
      }

      busyRef.current = true;
      setStatus("loading");
      await new Promise((r) => setTimeout(r, LOADING_MS));
      addItem(item);
      setStatus("success");
      showToast();
      await new Promise((r) => setTimeout(r, SUCCESS_MS));
      setStatus("idle");
      busyRef.current = false;
    },
    [addItem, reduceMotion, showToast],
  );

  return { addToCart, status, reduceMotion };
}
