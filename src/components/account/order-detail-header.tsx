import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { formatDate } from "@/lib/format";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function OrderDetailHeader({
  orderNumber,
  createdAt,
  status,
}: {
  orderNumber: string;
  createdAt: Date;
  status: string;
}) {
  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted-foreground)]">
          <li>
            <Link
              href="/conta/pedidos"
              className="inline-flex items-center gap-1 font-medium text-[var(--color-brown-muted)] transition hover:text-[var(--color-brown)]"
            >
              <ChevronLeft className="h-4 w-4" />
              Pedidos
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="font-medium text-[var(--color-brown)]">
            {orderNumber}
          </li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--color-brown)]">
            {orderNumber}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Realizado em {formatDate(createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={status} className="text-sm px-3 py-1" />
      </div>
    </div>
  );
}
