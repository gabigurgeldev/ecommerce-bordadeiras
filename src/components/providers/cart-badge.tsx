"use client";

import { useCartStore } from "@/store/cart";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

export function CartBadge() {
  const count = useCartStore((s) => s.itemCount());
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const prevCount = useRef(0);
  const [pop, setPop] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (count > prevCount.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 400);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  if (!mounted || count === 0) return null;

  return (
    <motion.span
      key={reduceMotion ? undefined : count}
      initial={reduceMotion ? false : { scale: 0.85 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
      className={cn(
        "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-cta)] px-1 text-[10px] font-bold text-white",
        pop && !reduceMotion && "badge-pop",
      )}
    >
      {count > 99 ? "99+" : count}
    </motion.span>
  );
}
