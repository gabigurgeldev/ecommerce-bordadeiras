import { listOrders } from "@/actions/admin/orders";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersList } from "@/components/admin/orders-list";
import { mapAdminOrderListRow } from "@/lib/types/admin-orders";

export default async function AdminOrdersPage() {
  const raw = await listOrders();
  const orders = raw.map((row) =>
    mapAdminOrderListRow(row as Record<string, unknown>),
  );

  return (
    <div>
      <PageHeader title="Pedidos" description="Acompanhe vendas e entregas" />
      <OrdersList orders={orders} />
    </div>
  );
}
