import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
  itemCount: number;
  trackingCode: string | null;
};

export type OrderDetail = OrderSummary & {
  shippingCents: number;
  customerName: string;
  customerEmail: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    priceCents: number;
  }[];
};

/** Requires authenticated userId from NextAuth — integration agent */
export async function getOrdersForUser(
  userId: string,
): Promise<OrderSummary[]> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      createdAt: o.createdAt,
      itemCount: o._count.items,
      trackingCode: o.trackingCode,
    }));
  } catch {
    return [];
  }
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });
    if (!order) return null;
    return {
      id: order.id,
      status: order.status,
      totalCents: order.totalCents,
      shippingCents: order.shippingCents,
      createdAt: order.createdAt,
      itemCount: order.items.length,
      trackingCode: order.trackingCode,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        priceCents: i.priceCents,
      })),
    };
  } catch {
    return null;
  }
}
