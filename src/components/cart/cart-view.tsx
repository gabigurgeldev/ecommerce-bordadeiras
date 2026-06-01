"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function CartView() {
  const { lines, removeItem, setQuantity, applyCoupon, subtotalCents, couponCode } =
    useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const subtotal = subtotalCents();
  const shippingEstimate = lines.length > 0 ? 4900 : 0;
  const discount = couponCode === "BORDA10" ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount + shippingEstimate;

  if (lines.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">Sua sacola está vazia.</p>
        <Button className="mt-6" asChild>
          <Link href="/loja">Ir para a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <ul className="space-y-4 lg:col-span-2">
        {lines.map((line) => (
          <li
            key={line.lineId}
            className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <Image src={line.imageUrl} alt={line.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="flex flex-1 flex-col">
              <Link href={`/produto/${line.slug}`} className="font-medium hover:text-rose-600">
                {line.name}
              </Link>
              <p className="text-sm text-rose-600">{formatCurrency(line.priceCents)}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setQuantity(line.lineId, line.quantity - 1)}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm">{line.quantity}</span>
                  <button type="button" onClick={() => setQuantity(line.lineId, line.quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button type="button" onClick={() => removeItem(line.lineId)} aria-label="Remover">
                  <Trash2 className="h-4 w-4 text-zinc-400 hover:text-rose-500" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <h2 className="font-semibold">Resumo</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Frete (estimativa)</dt>
            <dd>{formatCurrency(shippingEstimate)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <dt>Cupom</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold dark:border-zinc-700">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          <Input
            placeholder="Cupom"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => applyCoupon(couponInput || null)}
          >
            Aplicar
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Teste: BORDA10 (10% off)</p>

        <Button className="mt-6 w-full" size="lg" asChild>
          <Link href="/checkout">Finalizar compra</Link>
        </Button>
      </aside>
    </div>
  );
}
