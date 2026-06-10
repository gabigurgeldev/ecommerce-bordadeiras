import { getDb, TABLES } from "@/lib/supabase/db";
import type { OrderStatus } from "@/lib/types/database";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
  itemCount: number;
  trackingCode: string | null;
  carrier: string | null;
};

export type OrderDetail = OrderSummary & {
  shippingCents: number;
  subtotalCents: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: Record<string, unknown> | null;
  paidAt: Date | null;
  processingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    priceCents: number;
  }[];
};

function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  return new Date(String(value));
}

export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  try {
    const db = getDb();
    const { data: orders, error } = await db
      .from(TABLES.Order)
      .select("id, status, totalCents, createdAt, trackingCode, carrier")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });
    if (error || !orders) return [];

    const summaries = await Promise.all(
      orders.map(async (o) => {
        const { count } = await db
          .from(TABLES.OrderItem)
          .select("*", { count: "exact", head: true })
          .eq("orderId", o.id as string);
        return {
          id: String(o.id),
          status: o.status as OrderStatus,
          totalCents: Number(o.totalCents),
          createdAt: new Date(String(o.createdAt)),
          itemCount: count ?? 0,
          trackingCode: o.trackingCode != null ? String(o.trackingCode) : null,
          carrier: o.carrier != null ? String(o.carrier) : null,
        };
      }),
    );
    return summaries;
  } catch {
    return [];
  }
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  try {
    const db = getDb();
    const { data: order, error } = await db
      .from(TABLES.Order)
      .select(
        "id, status, totalCents, subtotalCents, shippingCents, createdAt, trackingCode, carrier, customerName, customerEmail, shippingAddress, paidAt, processingAt, shippedAt, deliveredAt, cancelledAt",
      )
      .eq("id", orderId)
      .eq("userId", userId)
      .maybeSingle();
    if (error || !order) return null;

    const { data: items } = await db
      .from(TABLES.OrderItem)
      .select("id, name, quantity, priceCents")
      .eq("orderId", orderId);

    return {
      id: String(order.id),
      status: order.status as OrderStatus,
      totalCents: Number(order.totalCents),
      subtotalCents: Number(order.subtotalCents ?? order.totalCents),
      shippingCents: Number(order.shippingCents),
      createdAt: new Date(String(order.createdAt)),
      itemCount: items?.length ?? 0,
      trackingCode: order.trackingCode != null ? String(order.trackingCode) : null,
      carrier: order.carrier != null ? String(order.carrier) : null,
      paidAt: parseDate(order.paidAt),
      processingAt: parseDate(order.processingAt),
      shippedAt: parseDate(order.shippedAt),
      deliveredAt: parseDate(order.deliveredAt),
      cancelledAt: parseDate(order.cancelledAt),
      customerName: String(order.customerName),
      customerEmail: String(order.customerEmail),
      shippingAddress:
        order.shippingAddress != null &&
        typeof order.shippingAddress === "object"
          ? (order.shippingAddress as Record<string, unknown>)
          : null,
      items: (items ?? []).map((i) => ({
        id: String(i.id),
        name: String(i.name),
        quantity: Number(i.quantity),
        priceCents: Number(i.priceCents),
      })),
    };
  } catch {
    return null;
  }
}
