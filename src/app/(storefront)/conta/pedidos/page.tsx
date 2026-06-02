import { formatCurrency, formatDate, formatOrderStatus } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Meus pedidos",
  path: "/conta/pedidos",
  noIndex: true,
});

/** Populated via fetchUserOrders() when auth session exists */
const demoOrders = [
  {
    id: "ord-demo-1",
    status: "SHIPPED" as const,
    totalCents: 8990000,
    createdAt: new Date("2026-05-20"),
    itemCount: 1,
    trackingCode: "BR123456789BR",
  },
];

export default function ContaPedidosPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Pedidos</h2>
      {demoOrders.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">Nenhum pedido ainda.</p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
          {demoOrders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-zinc-500">
                  {formatDate(order.createdAt)} · {order.itemCount} item(ns)
                </p>
                <p className="text-sm">{formatOrderStatus(order.status)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-rose-600">
                  {formatCurrency(order.totalCents)}
                </p>
                <Link
                  href={`/conta/pedidos/${order.id}`}
                  className="text-sm text-rose-500 hover:underline"
                >
                  Ver detalhes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
