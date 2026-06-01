import { OrderTracking } from "@/components/account/order-tracking";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

const demoOrder = {
  id: "ord-demo-1",
  status: "SHIPPED" as const,
  totalCents: 8990000,
  shippingCents: 4900,
  createdAt: new Date("2026-05-20"),
  trackingCode: "BR123456789BR",
  customerName: "Cliente Demo",
  customerEmail: "cliente@demo.com",
  items: [
    {
      id: "item-1",
      name: "Bordadeira Pro X12 — 12 agulhas",
      quantity: 1,
      priceCents: 8990000,
    },
  ],
};

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
  if (id !== demoOrder.id) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Pedido #{id.slice(-8).toUpperCase()}</h2>
        <p className="text-sm text-zinc-500">{formatDate(demoOrder.createdAt)}</p>
      </div>
      <OrderTracking
        status={demoOrder.status}
        trackingCode={demoOrder.trackingCode}
      />
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {demoOrder.items.map((item) => (
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
      <p className="text-right text-lg font-semibold">
        Total: {formatCurrency(demoOrder.totalCents + demoOrder.shippingCents)}
      </p>
    </div>
  );
}
