"use client";

import { validateCheckoutCoupon } from "@/actions/checkout";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { PendingCheckoutBanner } from "@/components/checkout/pending-checkout-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import type { PendingCheckoutResume } from "@/lib/data/pending-order";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function CartView({
  pendingOrder = null,
}: {
  pendingOrder?: PendingCheckoutResume | null;
}) {
  const { lines, removeItem, setQuantity, applyCoupon, subtotalCents, couponCode } =
    useCartStore();
  const [couponInput, setCouponInput] = useState(couponCode ?? "");
  const [discount, setDiscount] = useState(0);
  const subtotal = subtotalCents();
  const total = subtotal - discount;

  useEffect(() => {
    async function calc() {
      if (!couponCode) {
        setDiscount(0);
        return;
      }
      const result = await validateCheckoutCoupon(couponCode, subtotal);
      setDiscount(result.ok ? result.coupon.discountCents : 0);
    }
    void calc();
  }, [couponCode, subtotal]);

  async function handleApplyCoupon() {
    const code = couponInput.trim();
    if (!code) {
      applyCoupon(null);
      setDiscount(0);
      return;
    }
    const result = await validateCheckoutCoupon(code, subtotal);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    applyCoupon(code.toUpperCase());
    setDiscount(result.coupon.discountCents);
    toast.success("Cupom aplicado");
  }

  if (lines.length === 0) {
    if (pendingOrder) {
      return (
        <div className="py-8">
          <PendingCheckoutBanner order={pendingOrder} />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]">
          <ShoppingBag className="h-10 w-10 text-[var(--color-brown-muted)]" />
        </div>
        <p className="mt-6 text-[var(--muted-foreground)]">Sua sacola está vazia.</p>
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
            className="flex gap-4 rounded-2xl border border-[var(--color-card-border)] bg-white p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <Image src={line.imageUrl} alt={line.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/produto/${line.slug}`}
                className="font-medium text-[var(--color-brown)] hover:text-[var(--color-cta)]"
              >
                {line.name}
              </Link>
              <p className="text-sm text-[var(--color-price)]">{formatCurrency(line.priceCents)}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40">
                  <button
                    type="button"
                    className="tap-scale flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--color-brown)] hover:bg-[var(--secondary)]"
                    onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-[var(--color-brown)]">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="tap-scale flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--color-brown)] hover:bg-[var(--secondary)]"
                    onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.lineId)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center text-[var(--muted-foreground)] transition hover:text-[var(--destructive)]"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40 p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">Resumo</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--muted-foreground)]">Subtotal</dt>
            <dd className="text-[var(--color-brown)]">{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[var(--muted-foreground)]">Frete</dt>
            <dd className="text-right text-[var(--muted-foreground)]">Calculado no checkout</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[var(--color-green)]">
              <dt>Cupom</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--color-card-border)] pt-3">
            <dt className="font-display text-base font-semibold text-[var(--color-brown)]">Total</dt>
            <dd className="font-display text-xl font-bold text-[var(--color-price)]">
              {formatCurrency(total)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-2">
          <Input
            placeholder="Cupom"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
          />
          <Button variant="outline" type="button" onClick={() => void handleApplyCoupon()}>
            Aplicar
          </Button>
        </div>

        <CheckoutButton className="mt-6 w-full" size="lg">
          Finalizar compra
        </CheckoutButton>
      </aside>
    </div>
  );
}
