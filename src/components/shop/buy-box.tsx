"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency, formatInstallment } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import type { Product } from "@/lib/types/catalog";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function BuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const inStock = product.stock > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-semibold text-rose-600">
          {formatCurrency(product.priceCents)}
        </p>
        {product.compareAtCents && (
          <p className="text-sm text-zinc-500 line-through">
            {formatCurrency(product.compareAtCents)}
          </p>
        )}
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {formatInstallment(product.priceCents, siteConfig.installmentMax)}
        </p>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">{product.description}</p>

      {product.specs && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(product.specs).map(([k, v]) => (
            <div key={k} className="rounded-lg bg-zinc-100 px-3 py-2 dark:bg-zinc-800">
              <dt className="text-zinc-500">{k}</dt>
              <dd className="font-medium text-zinc-900 dark:text-white">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            className="p-2"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Diminuir"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="p-2"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            aria-label="Aumentar"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <span className="text-xs text-zinc-500">
          {inStock ? `${product.stock} em estoque` : "Indisponível"}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="flex-1"
          disabled={!inStock}
          onClick={() =>
            addItem({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.priceCents,
              imageUrl: product.images[0]!,
              quantity: qty,
            })
          }
        >
          <ShoppingBag className="h-5 w-5" />
          Adicionar à sacola
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/checkout">Comprar agora</Link>
        </Button>
      </div>
    </div>
  );
}
