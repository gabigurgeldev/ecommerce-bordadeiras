import { AccountSectionHeader } from "@/components/account/account-section-header";
import { OrdersView } from "@/components/account/orders-filters";
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
    <div className="space-y-6">
      <AccountSectionHeader
        title="Pedidos"
        description="Acompanhe o status e o histórico das suas compras."
      />
      <OrdersView orders={orders} />
    </div>
  );
}
