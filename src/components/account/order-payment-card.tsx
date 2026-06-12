import type { OrderPaymentSummary } from "@/lib/data/orders";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  formatPaymentStatus,
} from "@/lib/format";
import { CreditCard } from "lucide-react";

export function OrderPaymentCard({
  payments,
}: {
  payments: OrderPaymentSummary[];
}) {
  const primary = payments[0];

  return (
    <div className="account-card h-full">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--secondary)]">
          <CreditCard className="h-4 w-4 text-[var(--color-brown)]" />
        </span>
        <h3 className="font-display text-base font-semibold text-[var(--color-brown)]">
          Pagamento
        </h3>
      </div>

      {!primary ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Nenhum pagamento registrado ainda.
        </p>
      ) : (
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted-foreground)]">Método</dt>
            <dd className="font-medium text-[var(--color-brown)]">
              {formatPaymentMethod(primary.method)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted-foreground)]">Status</dt>
            <dd className="font-medium text-[var(--color-brown)]">
              {formatPaymentStatus(primary.status)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted-foreground)]">Valor</dt>
            <dd className="font-medium text-[var(--color-brown)]">
              {formatCurrency(primary.amountCents)}
            </dd>
          </div>
          {primary.paidAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--muted-foreground)]">Aprovado em</dt>
              <dd className="font-medium text-[var(--color-brown)]">
                {formatDate(primary.paidAt)}
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}
