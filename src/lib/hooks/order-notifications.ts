import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendTrackingEmail } from "@/lib/mail";
import {
  notifyNewOrder,
  notifyOrderShipped,
  notifyOrderCancelled,
} from "@/lib/whatsapp-client";
import { prisma } from "@/lib/prisma";

export async function onNewOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  const totalCents =
    order.items.reduce((s, i) => s + i.priceCents * i.quantity, 0) + order.shippingCents;

  try {
    await notifyNewOrder({
      orderId: order.id,
      customerName: order.customerName,
      amountCents: totalCents,
    });
  } catch (err) {
    console.error("[onNewOrder] whatsapp failed", err);
  }
}

export async function onOrderShipped(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED" },
  });

  try {
    await sendOrderShippedEmail({
      to: order.customerEmail,
      orderId: order.id,
      customerName: order.customerName,
      trackingCode: order.trackingCode,
    });
  } catch (err) {
    console.error("[onOrderShipped] email failed", err);
  }

  try {
    await notifyOrderShipped({
      orderId: order.id,
      customerName: order.customerName,
      trackingCode: order.trackingCode,
    });
  } catch (err) {
    console.error("[onOrderShipped] whatsapp failed", err);
  }
}

export async function onOrderDelivered(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "DELIVERED" },
  });

  try {
    await sendOrderDeliveredEmail({
      to: order.customerEmail,
      orderId: order.id,
      customerName: order.customerName,
    });
  } catch (err) {
    console.error("[onOrderDelivered] email failed", err);
  }
}

export async function onOrderCancelled(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });

  try {
    await notifyOrderCancelled({
      orderId: order.id,
      customerName: order.customerName,
    });
  } catch (err) {
    console.error("[onOrderCancelled] whatsapp failed", err);
  }
}

export async function onTrackingUpdate(
  orderId: string,
  trackingCode: string,
  trackingUrl?: string
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { trackingCode },
  });

  try {
    await sendTrackingEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      orderId: order.id,
      trackingCode,
      trackingUrl,
    });
  } catch (err) {
    console.error("[onTrackingUpdate] email failed", err);
  }
}
