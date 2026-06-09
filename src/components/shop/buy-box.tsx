"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatInstallment } from "@/lib/format";
import { siteConfig } from "@/lib/site";
import type { Product, ProductVariant } from "@/lib/types/catalog";
import { useCartStore } from "@/store/cart";
import {
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSession } from "@/components/providers/session-provider";
import { cn } from "@/lib/utils";

function variantLabel(v: ProductVariant) {
  return Object.entries(v.attributes)
    .map(([k, val]) => `${k}: ${val}`)
    .join(" · ");
}

function totalSoldCount(product: Product): number | null {
  if (!product.variants?.length) return null;
  const total = product.variants.reduce((sum, v) => sum + (v.soldCount ?? 0), 0);
  return total > 0 ? total : null;
}

export function BuyBox({
  product,
  categoryName,
  quantity: controlledQty,
  onQuantityChange,
}: {
  product: Product;
  categoryName?: string;
  quantity?: number;
  onQuantityChange?: (qty: number) => void;
}) {
  const [internalQty, setInternalQty] = useState(1);
  const qty = controlledQty ?? internalQty;
  const setQty = onQuantityChange ?? setInternalQty;

  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(
    product.variants?.[0]?.id,
  );
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();
  const { user } = useAppSession();

  const selectedVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId),
    [product.variants, selectedVariantId],
  );

  const priceCents = selectedVariant?.priceCents ?? product.priceCents;
  const compareCents = selectedVariant?.compareAtCents ?? product.compareAtCents;
  const stockUnlimited = selectedVariant?.stockUnlimited ?? product.stockUnlimited;
  const stock = selectedVariant?.stock ?? product.stock;
  const inStock = stockUnlimited || stock > 0;
  const soldCount = totalSoldCount(product);

  const discountPct =
    compareCents && compareCents > priceCents
      ? Math.round((1 - priceCents / compareCents) * 100)
      : null;

  function selectOptionValue(optionName: string, value: string) {
    if (!product.variants?.length) return;
    const current = selectedVariant?.attributes ?? {};
    const nextAttrs = { ...current, [optionName]: value };
    const match = product.variants.find((v) =>
      Object.entries(nextAttrs).every(([k, val]) => v.attributes[k] === val),
    );
    if (match) setSelectedVariantId(match.id);
  }

  function addToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      slug: product.slug,
      name: selectedVariant
        ? `${product.name} (${variantLabel(selectedVariant)})`
        : product.name,
      priceCents,
      imageUrl: selectedVariant?.imageUrl ?? product.images[0],
      quantity: qty,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {categoryName ? (
        <Link
          href={`/loja/categoria/${product.categorySlug}`}
          className="inline-flex w-fit rounded-full border border-[var(--color-card-border)] bg-[var(--secondary)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--color-brown-muted)] transition-colors hover:border-[var(--color-cta)]/40 hover:text-[var(--color-cta)]"
        >
          {categoryName}
        </Link>
      ) : null}

      <div>
        <h1 className="font-display text-2xl font-semibold leading-tight text-[var(--color-brown)] sm:text-3xl">
          {product.name}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted-foreground)]">
          {inStock ? (
            <span className="inline-flex items-center gap-1 text-[var(--color-green)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-green)]" />
              {stockUnlimited ? "Em estoque" : `${stock} disponíve${stock === 1 ? "l" : "is"}`}
            </span>
          ) : (
            <span className="text-red-600">Indisponível</span>
          )}
          {soldCount ? (
            <>
              <span aria-hidden="true">·</span>
              <span>+{soldCount} vendido{soldCount === 1 ? "" : "s"}</span>
            </>
          ) : null}
        </div>
      </div>

      {product.showPrice ? (
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-[var(--secondary)]/40 p-4">
          {compareCents && compareCents > priceCents ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-[var(--muted-foreground)] line-through">
                {formatCurrency(compareCents)}
              </p>
              {discountPct ? (
                <span className="rounded-md bg-[var(--color-cta)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--color-cta)]">
                  {discountPct}% OFF
                </span>
              ) : null}
            </div>
          ) : null}
          <p className="font-display text-3xl font-bold text-[var(--color-price)] sm:text-4xl">
            {formatCurrency(priceCents)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-brown-muted)]">
            {formatInstallment(priceCents, siteConfig.installmentMax)}
          </p>
        </div>
      ) : (
        <p className="text-lg font-medium text-[var(--color-brown)]">Consulte o preço</p>
      )}

      {product.options?.length ? (
        <div className="space-y-4">
          {product.options.map((opt) => (
            <div key={opt.name}>
              <p className="mb-2 text-sm font-medium text-[var(--color-brown)]">{opt.name}</p>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((val) => {
                  const active = selectedVariant?.attributes[opt.name] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => selectOptionValue(opt.name, val)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm transition-colors",
                        active
                          ? "border-[var(--color-cta)] bg-[var(--color-cta)]/10 font-medium text-[var(--color-cta)]"
                          : "border-[var(--color-card-border)] bg-white text-[var(--color-brown)] hover:border-[var(--color-brown)]/30",
                      )}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm font-medium text-[var(--color-brown)]">Quantidade</p>
        <div className="flex items-center rounded-xl border border-[var(--color-card-border)] bg-white">
          <button
            type="button"
            className="rounded-l-xl p-2.5 text-[var(--color-brown)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-40"
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="Diminuir quantidade"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-semibold text-[var(--color-brown)]">
            {qty}
          </span>
          <button
            type="button"
            className="rounded-r-xl p-2.5 text-[var(--color-brown)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-40"
            onClick={() => setQty(stockUnlimited ? qty + 1 : Math.min(stock, qty + 1))}
            disabled={!inStock || (!stockUnlimited && qty >= stock)}
            aria-label="Aumentar quantidade"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" className="flex-1" disabled={!inStock} onClick={addToCart}>
          <ShoppingBag className="h-4 w-4" />
          Adicionar ao carrinho
        </Button>
        <Button
          size="lg"
          variant="gold"
          className="flex-1"
          disabled={!inStock}
          onClick={() => {
            addToCart();
            if (!user) {
              router.push("/login?callbackUrl=%2Fcheckout");
            } else {
              router.push("/checkout");
            }
          }}
        >
          <Zap className="h-4 w-4" />
          Comprar agora
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 p-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green)]" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-brown)]">Devolução grátis</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">Consulte condições</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green)]" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-brown)]">Compra garantida</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">Receba o que pediu</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-green)]" />
          <div>
            <p className="text-xs font-semibold text-[var(--color-brown)]">Envio seguro</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">Rastreamento disponível</p>
          </div>
        </div>
      </div>
    </div>
  );
}
