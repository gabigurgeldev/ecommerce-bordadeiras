import { sendOrderShippedEmail, sendOrderDeliveredEmail, sendTrackingEmail } from "@/lib/mail";
import {
  notifyNewOrder,
  notifyOrderShipped,
  notifyOrderCancelled,
} from "@/lib/whatsapp-client";
import { getDb, TABLES } from "@/lib/supabase/db";

export async function onNewOrder(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { data: items } = await db
    .from(TABLES.OrderItem)
    .select("*")
    .eq("orderId", orderId);

  const totalCents =
    (items ?? []).reduce(
      (s, i) => s + Number(i.priceCents) * Number(i.quantity),
      0,
    ) + Number(order.shippingCents);

  try {
    await notifyNewOrder({
      orderId: String(order.id),
      customerName: String(order.customerName),
      amountCents: totalCents,
    });
  } catch (err) {
    console.error("[onNewOrder] whatsapp failed", err);
  }
}

export async function onOrderShipped(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  await db.from(TABLES.Order).update({ status: "SHIPPED" }).eq("id", orderId);

  try {
    await sendOrderShippedEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
      trackingCode: order.trackingCode != null ? String(order.trackingCode) : null,
    });
  } catch (err) {
    console.error("[onOrderShipped] email failed", err);
  }

  try {
    await notifyOrderShipped({
      orderId: String(order.id),
      customerName: String(order.customerName),
      trackingCode: order.trackingCode != null ? String(order.trackingCode) : null,
    });
  } catch (err) {
    console.error("[onOrderShipped] whatsapp failed", err);
  }
}

export async function onOrderDelivered(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  await db.from(TABLES.Order).update({ status: "DELIVERED" }).eq("id", orderId);

  try {
    await sendOrderDeliveredEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
    });
  } catch (err) {
    console.error("[onOrderDelivered] email failed", err);
  }
}

export async function onOrderCancelled(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  await db.from(TABLES.Order).update({ status: "CANCELLED" }).eq("id", orderId);

  try {
    await notifyOrderCancelled({
      orderId: String(order.id),
      customerName: String(order.customerName),
    });
  } catch (err) {
    console.error("[onOrderCancelled] whatsapp failed", err);
  }
}

export async function onTrackingUpdate(
  orderId: string,
  trackingCode: string,
  trackingUrl?: string,
): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  await db.from(TABLES.Order).update({ trackingCode }).eq("id", orderId);

  try {
    await sendTrackingEmail({
      to: String(order.customerEmail),
      customerName: String(order.customerName),
      orderId: String(order.id),
      trackingCode,
      trackingUrl,
    });
  } catch (err) {
    console.error("[onTrackingUpdate] email failed", err);
  }
}
