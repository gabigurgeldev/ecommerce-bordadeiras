import { OrderStatus } from "@/lib/types/database";

/** Order statuses that represent a completed sale (payment received). */
export const PAID_ORDER_STATUSES = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

export function isPaidOrderStatus(status: string): boolean {
  return (PAID_ORDER_STATUSES as readonly string[]).includes(status);
}
