"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { useCartStore } from "@/store/cart";
import { ChevronDown, Loader2, Minus, Plus, Tag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type CouponProps = {
  couponCode: string | null;
  couponInput: string;
  couponError: string | null;
  couponLoading: boolean;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
};

function formatShippingLine(shippingCents: number, shippingCalculated: boolean) {
  if (!shippingCalculated) {
    return <span className="text-zinc-500">Calcule o frete</span>;
  }
  if (shippingCents === 0) {
    return <span className="text-emerald-600">Grátis</span>;
  }
  return formatCurrency(shippingCents);
}

export function CheckoutOrderSummary({
  shippingCents,
  shippingCalculated = false,
  shippingLabel,
  discountCents,
  collapsible = false,
  cardStyle,
  headingStyle,
  coupon,
}: {
  shippingCents: number;
  shippingCalculated?: boolean;
  shippingLabel?: string;
  discountCents: number;
  collapsible?: boolean;
  cardStyle?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
  coupon?: CouponProps;
}) {
  const { lines, removeItem, setQuantity, subtotalCents } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const subtotal = mounted ? subtotalCents() : 0;
  const total =
    subtotal - discountCents + (shippingCalculated ? shippingCents : 0);
  const displayLines = mounted ? lines : [];

  const content = (
    <>
      <ul className="space-y-4">
        {displayLines.map((line) => (
          <li key={line.lineId} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-zinc-50">
              <Image
                src={line.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/produto/${line.slug}`}
                className="line-clamp-2 text-sm font-medium hover:text-rose-600"
                style={headingStyle}
              >
                {line.name}
              </Link>
              <p className="text-xs text-zinc-500">
                {formatCurrency(line.priceCents)} × {line.quantity}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded border p-1 transition-colors hover:border-zinc-400"
                  onClick={() => setQuantity(line.lineId, line.quantity - 1)}
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="min-w-[1.25rem] text-center text-sm font-medium">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  className="rounded border p-1 transition-colors hover:border-zinc-400"
                  onClick={() => setQuantity(line.lineId, line.quantity + 1)}
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(line.lineId)}
                  className="ml-auto text-zinc-400 transition-colors hover:text-rose-600"
                  aria-label="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {coupon && (
        <div className="mt-4 border-t pt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Cupom de desconto
          </p>
          {coupon.couponCode ? (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
              <Tag className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="min-w-0 flex-1 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {coupon.couponCode}
              </span>
              <button
                type="button"
                onClick={coupon.onRemoveCoupon}
                className="rounded-full p-0.5 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                aria-label="Remover cupom"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <Input
                  placeholder="Código"
                  value={coupon.couponInput}
                  onChange={(e) => coupon.onCouponInputChange(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") coupon.onApplyCoupon();
                  }}
                  disabled={coupon.couponLoading}
                  className={`h-9 text-sm ${coupon.couponError ? "border-red-400" : ""}`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={coupon.onApplyCoupon}
                  disabled={coupon.couponLoading || !coupon.couponInput.trim()}
                  className="shrink-0"
                >
                  {coupon.couponLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Aplicar"
                  )}
                </Button>
              </div>
              {coupon.couponError && (
                <p className="text-xs text-red-600">{coupon.couponError}</p>
              )}
            </div>
          )}
        </div>
      )}

      <dl className="mt-6 space-y-2 border-t pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-zinc-500">Subtotal</dt>
          <dd>{formatCurrency(subtotal)}</dd>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-emerald-600">
            <dt>Desconto do cupom</dt>
            <dd>−{formatCurrency(discountCents)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-zinc-500">
            Frete
            {shippingLabel && shippingCalculated ? (
              <span className="mt-0.5 block text-xs font-normal text-zinc-400">
                {shippingLabel}
              </span>
            ) : null}
          </dt>
          <dd>{formatShippingLine(shippingCents, shippingCalculated)}</dd>
        </div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatCurrency(total)}</dd>
        </div>
      </dl>
    </>
  );

  if (collapsible) {
    return (
      <CollapsibleSummary
        total={total}
        mounted={mounted}
        cardStyle={cardStyle}
        headingStyle={headingStyle}
      >
        {content}
      </CollapsibleSummary>
    );
  }

  return (
    <div
      className="rounded-2xl border bg-zinc-50 p-6 dark:bg-zinc-900/50"
      style={cardStyle}
    >
      <h2 className="font-semibold" style={headingStyle}>
        Resumo do pedido
      </h2>
      <div className="mt-4">{content}</div>
    </div>
  );
}

/**
 * Animated collapsible summary for mobile (hidden on lg+).
 * Uses a ref-based height animation instead of CSS `details` to allow
 * smooth open/close transitions.
 */
function CollapsibleSummary({
  total,
  mounted,
  children,
  cardStyle,
  headingStyle,
}: {
  total: number;
  mounted: boolean;
  children: React.ReactNode;
  cardStyle?: React.CSSProperties;
  headingStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  function toggle() {
    if (!bodyRef.current) {
      setOpen((v) => !v);
      return;
    }
    if (!open) {
      // Expand: set height from 0 → scrollHeight
      bodyRef.current.style.height = "0px";
      bodyRef.current.style.display = "block";
      requestAnimationFrame(() => {
        if (bodyRef.current) {
          bodyRef.current.style.height = `${bodyRef.current.scrollHeight}px`;
        }
      });
    } else {
      // Collapse: set height from current → 0
      if (bodyRef.current) {
        bodyRef.current.style.height = `${bodyRef.current.scrollHeight}px`;
        requestAnimationFrame(() => {
          if (bodyRef.current) bodyRef.current.style.height = "0px";
        });
      }
    }
    setOpen((v) => !v);
  }

  function handleTransitionEnd() {
    if (bodyRef.current && open) {
      // After open animation, remove fixed height so content can resize freely
      bodyRef.current.style.height = "auto";
    }
  }

  return (
    <div
      className="rounded-2xl border bg-white p-4 dark:bg-zinc-900 lg:hidden"
      style={cardStyle}
    >
      {/* Summary toggle header — sticky so it stays visible while scrolling */}
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="font-semibold" style={headingStyle}>
          Resumo do pedido
        </span>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="font-medium" suppressHydrationWarning>
            {mounted ? formatCurrency(total) : "—"}
          </span>
          <ChevronDown
            className="h-4 w-4 transition-transform duration-300"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </div>
      </button>

      {/* Animated body */}
      <div
        ref={bodyRef}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: open ? undefined : "0px", display: open ? "block" : "none" }}
        onTransitionEnd={handleTransitionEnd}
      >
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
