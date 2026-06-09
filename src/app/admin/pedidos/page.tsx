import { listOrders } from "@/actions/admin/orders";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersList } from "@/components/admin/orders-list";

export default async function AdminOrdersPage() {
  const raw = await listOrders();
  const orders = raw.map((row) => {
    const o = row as Record<string, unknown>;
    return {
      id: String(o.id),
      customerName: String(o.customerName ?? ""),
      customerEmail: String(o.customerEmail ?? ""),
      totalCents: Number(o.totalCents),
      status: String(o.status),
      createdAt: o.createdAt as string | Date,
    };
  });

  return (
    <div>
      <PageHeader title="Pedidos" description="Acompanhe vendas e entregas" />
      <OrdersList orders={orders} />
    </div>
  );
}
