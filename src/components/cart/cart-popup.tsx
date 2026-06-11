"use client";

import { fetchPendingCheckoutResume } from "@/actions/checkout";
import { CheckoutButton } from "@/components/cart/checkout-button";
import { PendingCheckoutBanner } from "@/components/checkout/pending-checkout-banner";
import { StorefrontSheet } from "@/components/storefront/storefront-sheet";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { PendingCheckoutResume } from "@/lib/data/pending-order";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const PREVIEW_LIMIT = 5;

export function CartPopup({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lines, removeItem, setQuantity, subtotalCents, itemCount } =
    useCartStore();
  const [pendingOrder, setPendingOrder] = useState<PendingCheckoutResume | null>(
    null,
  );
  const subtotal = subtotalCents();
  const total = subtotal;
  const count = itemCount();

  useEffect(() => {
    if (!open || lines.length > 0) {
      setPendingOrder(null);
      return;
    }
    let cancelled = false;
    void fetchPendingCheckoutResume().then((order) => {
      if (!cancelled) setPendingOrder(order);
    });
    return () => {
      cancelled = true;
    };
  }, [open, lines.length]);

  const previewLines =
    lines.length > PREVIEW_LIMIT
      ? lines.slice(-PREVIEW_LIMIT).reverse()
      : [...lines].reverse();

  return (
    <StorefrontSheet
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Sua Sacola"
      description={
        lines.length > 0
          ? `${count} ${count === 1 ? "item" : "itens"} na sacola`
          : undefined
      }
      side="right"
      footer={
        lines.length > 0 ? (
          <div className="p-6">
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-zinc-600">
                <span>Frete</span>
                <span className="text-zinc-500">No checkout</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold text-[var(--color-brown)]">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="grid gap-3">
              <CheckoutButton
                size="lg"
                className="w-full text-base"
                onBeforeNavigate={onClose}
              >
                Finalizar compra
              </CheckoutButton>
              <Button variant="outline" size="lg" className="w-full bg-white" asChild>
                <Link href="/sacola" onClick={onClose}>
                  Ver todos os itens da sacola
                </Link>
              </Button>
            </div>
          </div>
        ) : undefined
      }
    >
      <div className="p-6">
        {lines.length === 0 ? (
          pendingOrder ? (
            <PendingCheckoutBanner
              order={pendingOrder}
              compact
              onContinue={onClose}
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50">
                <ShoppingBag className="h-10 w-10 text-zinc-300" />
              </div>
              <div>
                <p className="text-lg font-medium text-zinc-900">
                  Sua sacola está vazia
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Adicione itens para começar a comprar.
                </p>
              </div>
              <Button onClick={onClose} className="mt-4" asChild>
                <Link href="/loja">Continuar comprando</Link>
              </Button>
            </div>
          )
        ) : (
          <>
            {lines.length > PREVIEW_LIMIT && (
              <p className="mb-4 text-xs text-[var(--muted-foreground)]">
                Exibindo os {PREVIEW_LIMIT} itens adicionados mais recentemente.{" "}
                <Link
                  href="/sacola"
                  onClick={onClose}
                  className="font-medium text-[var(--color-brown)] underline"
                >
                  Ver todos ({lines.length})
                </Link>
              </p>
            )}

            <ul className="space-y-6" aria-label="Itens na sacola">
              {previewLines.map((line) => (
                <li key={line.lineId} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50">
                    <Image
                      src={line.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/produto/${line.slug}`}
                      onClick={onClose}
                      className="line-clamp-2 text-sm font-medium text-[var(--color-brown)] hover:text-rose-600"
                    >
                      {line.name}
                    </Link>

                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatCurrency(line.priceCents)} cada
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex h-8 items-center rounded-lg border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          className="flex h-full w-8 items-center justify-center text-zinc-500 transition hover:text-zinc-900"
                          onClick={() =>
                            setQuantity(line.lineId, line.quantity - 1)
                          }
                          aria-label={`Diminuir quantidade de ${line.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className="flex w-6 items-center justify-center text-sm font-medium"
                          aria-label={`Quantidade: ${line.quantity}`}
                        >
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-full w-8 items-center justify-center text-zinc-500 transition hover:text-zinc-900"
                          onClick={() =>
                            setQuantity(line.lineId, line.quantity + 1)
                          }
                          aria-label={`Aumentar quantidade de ${line.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-rose-600">
                          {formatCurrency(line.priceCents * line.quantity)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeItem(line.lineId)}
                          className="mt-1 flex items-center gap-1 text-xs font-medium text-zinc-400 transition hover:text-rose-600"
                          aria-label={`Remover ${line.name} da sacola`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </StorefrontSheet>
  );
}
