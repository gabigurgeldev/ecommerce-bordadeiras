import { notFound } from "next/navigation";
import { PaymentMethod, PaymentStatus } from "@/lib/types/database";
import { getOrder } from "@/actions/admin/orders";
import { PageHeader } from "@/components/admin/page-header";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Badge } from "@/components/ui/badge";
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

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  PIX: "Pix",
  CREDIT_CARD: "Cartão de crédito",
  BOLETO: "Boleto",
};

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div>
      <PageHeader
        title={`Pedido #${order.id.slice(-8)}`}
        description={`Criado em ${formatDate(order.createdAt)}`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{order.customerName}</p>
            <p className="text-muted-foreground">{order.customerEmail}</p>
            {order.customerPhone && <p>{order.customerPhone}</p>}
            <p className="font-medium pt-2">Total: {formatCurrency(order.totalCents)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status e rastreio</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusForm order={order} />
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {order.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>ID Mercado Pago</TableHead>
                  <TableHead>Pago em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === PaymentStatus.APPROVED ? "default" : "secondary"}>
                        {paymentStatusLabels[payment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amountCents)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.mercadoPagoId ?? "—"}
                    </TableCell>
                    <TableCell>
                      {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Preço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.priceCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
