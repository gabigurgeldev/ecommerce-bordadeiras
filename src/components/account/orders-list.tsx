import { OrderStatusBadge } from "@/components/account/order-status-badge";
import { OrderStatusPipeline } from "@/components/orders/order-status-pipeline";
import { Button } from "@/components/ui/button";
import type { OrderSummary } from "@/lib/data/orders";
import {
  formatCurrency,
  formatDate,
  formatPaymentMethod,
  getOrderNextStep,
} from "@/lib/format";
import { ArrowRight, CreditCard, Package, Truck } from "lucide-react";
import Link from "next/link";

export function OrdersList({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="account-card text-center">
        <Package className="mx-auto h-10 w-10 text-[var(--color-brown-muted)]" />
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">
          Nenhum pedido encontrado neste filtro.
        </p>
        <Button className="mt-6" variant="outline" asChild>
          <Link href="/loja">Explorar a loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <ul className="space-y-4" aria-label="Lista de pedidos">
      {orders.map((order) => (
        <li key={order.id}>
          <div className="account-card transition hover:border-[var(--color-brown)]/25 hover:shadow-md">
            <Link href={`/conta/pedidos/${order.id}`} className="block">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] ring-1 ring-[var(--color-card-border)]">
                    <Package className="h-5 w-5 text-[var(--color-brown)]" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold text-[var(--color-brown)]">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
                      {formatDate(order.createdAt)} · {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "itens"}
                    </p>
                    {order.paymentMethod ? (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Pagamento: {formatPaymentMethod(order.paymentMethod)}
                      </p>
                    ) : null}
                    {order.trackingCode ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                        <Truck className="h-3.5 w-3.5 shrink-0" />
                        Rastreio: {order.trackingCode}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="text-right">
                  <OrderStatusBadge status={order.status} />
                  <p className="mt-2 font-semibold text-[var(--color-brown)]">
                    {formatCurrency(order.totalCents)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-card-border)] pt-4">
                <OrderStatusPipeline status={order.status} size="md" />
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brown-muted)]">
                  Ver detalhes
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>

              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                {getOrderNextStep(order.status)}
              </p>
            </Link>

            {order.status === "PENDING" ? (
              <Button className="mt-4 w-full gap-2 sm:w-auto" asChild>
                <Link href={`/checkout?order=${order.id}`}>
                  <CreditCard className="h-4 w-4" />
                  Continuar pagamento
                </Link>
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
