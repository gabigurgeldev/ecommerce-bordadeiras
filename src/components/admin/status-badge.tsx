import { Badge } from "@/components/ui/badge";
import { formatOrderStatus } from "@/lib/format";
import { OrderStatus, PaymentStatus, ProductStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export const orderStatusLabels: Record<string, string> = {
  [OrderStatus.PENDING]: formatOrderStatus("PENDING"),
  [OrderStatus.PAID]: formatOrderStatus("PAID"),
  [OrderStatus.PROCESSING]: formatOrderStatus("PROCESSING"),
  [OrderStatus.SHIPPED]: formatOrderStatus("SHIPPED"),
  [OrderStatus.DELIVERED]: formatOrderStatus("DELIVERED"),
  [OrderStatus.CANCELLED]: formatOrderStatus("CANCELLED"),
};

const orderStatusClass: Record<string, string> = {
  [OrderStatus.PENDING]:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
  [OrderStatus.PAID]:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  [OrderStatus.PROCESSING]:
    "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  [OrderStatus.SHIPPED]:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200",
  [OrderStatus.DELIVERED]:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  [OrderStatus.CANCELLED]:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
};

export const orderStatusBorderClass: Record<string, string> = {
  [OrderStatus.PENDING]: "border-l-amber-400",
  [OrderStatus.PAID]: "border-l-blue-500",
  [OrderStatus.PROCESSING]: "border-l-violet-500",
  [OrderStatus.SHIPPED]: "border-l-indigo-500",
  [OrderStatus.DELIVERED]: "border-l-emerald-500",
  [OrderStatus.CANCELLED]: "border-l-red-500",
};

const paymentStatusLabels: Record<string, string> = {
  [PaymentStatus.PENDING]: "Pendente",
  [PaymentStatus.APPROVED]: "Aprovado",
  [PaymentStatus.REJECTED]: "Rejeitado",
  [PaymentStatus.REFUNDED]: "Reembolsado",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(orderStatusClass[status], className)}
    >
      {orderStatusLabels[status] ?? formatOrderStatus(status)}
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
