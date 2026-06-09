import { OrdersList } from "@/components/account/orders-list";
import { fetchUserOrders } from "@/actions/orders";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Meus pedidos",
  path: "/conta/pedidos",
  noIndex: true,
});

export default async function ContaPedidosPage() {
  const orders = await fetchUserOrders();

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
        Pedidos
      </h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        Acompanhe o status e o histórico das suas compras.
      </p>
      <div className="mt-6">
        <OrdersList orders={orders} />
      </div>
    </div>
  );
}
