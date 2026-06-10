import { formatCurrency, formatDate, formatOrderStatus } from "@/lib/format";
import type { OrderSummary } from "@/lib/data/orders";
import Link from "next/link";
import { Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-zinc-100 text-zinc-600",
};

export function OrdersList({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div>
        <p className="rounded-2xl border border-dashed border-[var(--color-card-border)] bg-[var(--secondary)]/40 px-6 py-10 text-center text-sm text-[var(--muted-foreground)]">
          Você ainda não tem pedidos. Quando fizer uma compra, o histórico aparecerá aqui.
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
          <Link
            href={`/conta/pedidos/${order.id}`}
            className="block rounded-2xl border border-[var(--color-card-border)] bg-white p-5 transition hover:border-[var(--color-brown)]/30 hover:shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--secondary)]">
                  <Package className="h-5 w-5 text-[var(--color-brown)]" />
                </span>
                <div>
                  <p className="font-semibold text-[var(--color-brown)]">
                    Pedido #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    {formatDate(order.createdAt)} · {order.itemCount}{" "}
                    {order.itemCount === 1 ? "item" : "itens"}
                  </p>
                  {order.trackingCode && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
                      <Truck className="h-3.5 w-3.5 shrink-0" />
                      Rastreio: {order.trackingCode}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[order.status] ?? "bg-zinc-100"}`}
                >
                  {formatOrderStatus(order.status)}
                </span>
                <p className="mt-2 font-semibold text-[var(--color-brown)]">
                  {formatCurrency(order.totalCents)}
                </p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
