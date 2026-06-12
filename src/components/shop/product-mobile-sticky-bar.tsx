"use client";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import type { AddToCartItem } from "@/hooks/use-add-to-cart-feedback";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types/catalog";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ProductMobileStickyBar({
  product,
  priceCents,
  quantity,
  inStock,
  cartItem,
  buyBoxRef,
}: {
  product: Product;
  priceCents: number;
  quantity: number;
  inStock: boolean;
  cartItem: AddToCartItem;
  buyBoxRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [buyBoxRef]);

  if (!visible || !inStock) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-card-border)] bg-white/95 shadow-[0_-4px_24px_rgba(92,67,50,0.12)] backdrop-blur-md lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        {product.showPrice ? (
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold text-[var(--color-price)]">
              {formatCurrency(priceCents)}
            </p>
            {quantity > 1 ? (
              <p className="text-xs text-[var(--muted-foreground)]">Qtd: {quantity}</p>
            ) : null}
          </div>
        ) : null}
        <AddToCartButton
          item={cartItem}
          icon="bag"
          idleLabel="Adicionar"
          className="max-w-[200px] shrink-0 flex-1"
          disabled={!inStock}
        />
      </div>
    </div>
  );
}
