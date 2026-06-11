import { listCustomers } from "@/actions/admin/customers";
import { PageHeader } from "@/components/admin/page-header";
import { CustomersList } from "@/components/admin/customers-list";

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <PageHeader title="Clientes" description="Usuários cadastrados na loja" />
      <CustomersList
        customers={customers.map((c) => ({
          id: String(c.id),
          name: c.name != null ? String(c.name) : null,
          email: String(c.email),
          phone: c.phone != null ? String(c.phone) : null,
          orderCount: c._count.orders,
          createdAt: c.createdAt,
          hasPendingPayment: c._signals.hasPendingPayment,
          hasActiveCart: c._signals.hasActiveCart,
        }))}
      />
    </div>
  );
}
