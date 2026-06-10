import { OrderTracking } from "@/components/account/order-tracking";
import { fetchUserOrder } from "@/actions/orders";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return buildMetadata({
    title: `Pedido ${id.slice(-8)}`,
    path: `/conta/pedidos/${id}`,
    noIndex: true,
  });
}

export default async function ContaPedidoDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await fetchUserOrder(id);
  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
          Pedido #{order.id.slice(-8).toUpperCase()}
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          {formatDate(order.createdAt)}
        </p>
      </div>

      <OrderTracking
        status={order.status}
        trackingCode={order.trackingCode}
        carrier={order.carrier}
        paidAt={order.paidAt}
        processingAt={order.processingAt}
        shippedAt={order.shippedAt}
        deliveredAt={order.deliveredAt}
        cancelledAt={order.cancelledAt}
      />

      {addr && (
        <div className="rounded-2xl border border-[var(--color-card-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-brown)]">
            Endereço de entrega
          </h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {String(addr.street ?? "")}, {String(addr.number ?? "")}
            {addr.complement ? ` — ${String(addr.complement)}` : ""}
            <br />
            {String(addr.neighborhood ?? "")}, {String(addr.city ?? "")} —{" "}
            {String(addr.state ?? "")}
            <br />
            CEP {String(addr.cep ?? addr.zipCode ?? "")}
          </p>
        </div>
      )}

      <ul className="divide-y divide-[var(--color-card-border)] rounded-2xl border border-[var(--color-card-border)]">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex justify-between gap-4 px-4 py-3 text-sm"
          >
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatCurrency(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-1 text-right text-sm">
        <p className="text-[var(--muted-foreground)]">
          Subtotal: {formatCurrency(order.subtotalCents)}
        </p>
        <p className="text-[var(--muted-foreground)]">
          Frete: {formatCurrency(order.shippingCents)}
        </p>
        <p className="text-lg font-semibold text-[var(--color-brown)]">
          Total: {formatCurrency(order.totalCents)}
        </p>
      </div>
    </div>
  );
}
