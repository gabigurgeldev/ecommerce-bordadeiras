import { Badge } from "@/components/ui/badge";
import { OrderStatus, PaymentStatus, ProductStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export const orderStatusLabels: Record<string, string> = {
  [OrderStatus.PENDING]: "Pendente",
  [OrderStatus.PAID]: "Pago",
  [OrderStatus.PROCESSING]: "Em processamento",
  [OrderStatus.SHIPPED]: "Enviado",
  [OrderStatus.DELIVERED]: "Entregue",
  [OrderStatus.CANCELLED]: "Cancelado",
};

const orderStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.PAID]: "default",
  [OrderStatus.PROCESSING]: "secondary",
  [OrderStatus.SHIPPED]: "default",
  [OrderStatus.DELIVERED]: "default",
  [OrderStatus.CANCELLED]: "destructive",
};

const paymentStatusLabels: Record<string, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.APPROVED]: "Aprovado",
  [PaymentStatus.REJECTED]: "Rejeitado",
  [PaymentStatus.REFUNDED]: "Reembolsado",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={orderStatusVariant[status] ?? "outline"} className={cn(className)}>
      {orderStatusLabels[status] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn(className)}>
      {paymentStatusLabels[status] ?? status}
    </Badge>
  );
}

export const productStatusLabels: Record<string, string> = {
  [ProductStatus.DRAFT]: "Rascunho",
  [ProductStatus.ACTIVE]: "Ativo",
  [ProductStatus.ARCHIVED]: "Arquivado",
  [ProductStatus.OUT_OF_STOCK]: "Sem estoque",
};

const productStatusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  [ProductStatus.ACTIVE]: "default",
  [ProductStatus.DRAFT]: "secondary",
  [ProductStatus.ARCHIVED]: "outline",
  [ProductStatus.OUT_OF_STOCK]: "destructive",
};

export function ProductStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={productStatusVariant[status] ?? "outline"} className={cn(className)}>
      {productStatusLabels[status] ?? status}
    </Badge>
  );
}
