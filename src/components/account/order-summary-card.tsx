import { formatCurrency } from "@/lib/format";

export function OrderSummaryCard({
  subtotalCents,
  discountCents,
  couponCode,
  shippingCents,
  shippingServiceName,
  totalCents,
}: {
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  shippingCents: number;
  shippingServiceName: string | null;
  totalCents: number;
}) {
  return (
    <div className="account-card h-full">
      <h3 className="font-display text-base font-semibold text-[var(--color-brown)]">
        Resumo financeiro
      </h3>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">Subtotal</dt>
          <dd>{formatCurrency(subtotalCents)}</dd>
        </div>
        {discountCents > 0 ? (
          <div className="flex justify-between gap-4 text-emerald-700">
            <dt>
              Desconto
              {couponCode ? ` (${couponCode})` : ""}
            </dt>
            <dd>−{formatCurrency(discountCents)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted-foreground)]">
            Frete
            {shippingServiceName ? (
              <span className="mt-0.5 block text-xs">{shippingServiceName}</span>
            ) : null}
          </dt>
          <dd>{formatCurrency(shippingCents)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[var(--color-card-border)] pt-3 text-base font-semibold text-[var(--color-brown)]">
          <dt>Total</dt>
          <dd>{formatCurrency(totalCents)}</dd>
        </div>
      </dl>
    </div>
  );
}
