import { OrderStatus, type OrderStatus as OrderStatusType } from "@/lib/types/database";

const ALLOWED: Record<OrderStatusType, OrderStatusType[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransitionOrderStatus(
  from: OrderStatusType,
  to: OrderStatusType,
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function validateOrderStatusUpdate(input: {
  currentStatus: OrderStatusType;
  nextStatus: OrderStatusType;
  trackingCode?: string | null;
  carrier?: string | null;
}): string | null {
  const { currentStatus, nextStatus, trackingCode, carrier } = input;

  if (currentStatus === nextStatus) {
    if (nextStatus === OrderStatus.SHIPPED && !trackingCode?.trim()) {
      return "Informe o código de rastreio para marcar como enviado.";
    }
    return null;
  }

  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    return `Não é possível alterar de "${currentStatus}" para "${nextStatus}".`;
  }

  if (nextStatus === OrderStatus.SHIPPED) {
    if (!trackingCode?.trim()) {
      return "Informe o código de rastreio para marcar como enviado.";
    }
    if (!carrier?.trim()) {
      return "Informe a transportadora (ex.: Correios).";
    }
  }

  return null;
}

export function statusTimestampField(
  status: OrderStatusType,
): keyof Pick<
  import("@/lib/types/database").Order,
  "paidAt" | "processingAt" | "shippedAt" | "deliveredAt" | "cancelledAt"
> | null {
  switch (status) {
    case OrderStatus.PAID:
      return "paidAt";
    case OrderStatus.PROCESSING:
      return "processingAt";
    case OrderStatus.SHIPPED:
      return "shippedAt";
    case OrderStatus.DELIVERED:
      return "deliveredAt";
    case OrderStatus.CANCELLED:
      return "cancelledAt";
    default:
      return null;
  }
}

export function nextSuggestedStatus(
  current: OrderStatusType,
): OrderStatusType | null {
  switch (current) {
    case OrderStatus.PAID:
      return OrderStatus.PROCESSING;
    case OrderStatus.PROCESSING:
      return OrderStatus.SHIPPED;
    case OrderStatus.SHIPPED:
      return OrderStatus.DELIVERED;
    default:
      return null;
  }
}
