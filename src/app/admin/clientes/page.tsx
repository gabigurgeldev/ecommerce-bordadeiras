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
          id: c.id,
          name: c.name,
          email: c.email,
          orderCount: c._count.orders,
          createdAt: c.createdAt,
        }))}
      />
    </div>
  );
}
