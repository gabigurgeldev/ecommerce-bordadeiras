import { notFound } from "next/navigation";
import { getCustomer } from "@/actions/admin/customers";
import { PageHeader } from "@/components/admin/page-header";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div>
      <PageHeader title={customer.name ?? customer.email} description="Histórico de pedidos" />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>{customer.email}</p>
          <p className="text-muted-foreground">Cadastro: {formatDate(customer.createdAt)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({customer.orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <AdminEmptyState title="Sem pedidos" description="Este cliente ainda não realizou compras." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((order: { id: string; totalCents: number; status: string; createdAt: Date }) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          #{order.id.slice(-8)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalCents)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
