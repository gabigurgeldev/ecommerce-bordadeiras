import {
  sendOrderDeliveredEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendTrackingEmail,
} from "@/lib/mail";
import { buildTrackingUrl } from "@/lib/tracking-url";
import {
  notifyNewOrder,
  notifyOrderShipped,
  notifyOrderCancelled,
  notifyOrderProcessing,
  notifyOrderDelivered,
} from "@/lib/whatsapp-client";
import { getDb, TABLES } from "@/lib/supabase/db";
import { buildOrderWhatsappMeta } from "@/lib/hooks/order-whatsapp-helpers";
import { logAdminNotifyResult } from "@/lib/whatsapp-notify-types";

export async function onNewOrder(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  const { amountCents, storeName, orderDate, customerPhone } =
    buildOrderWhatsappMeta(order);

  try {
    const result = await notifyNewOrder({
      orderId: String(order.id),
      customerName: String(order.customerName),
      amountCents,
      customerPhone,
      storeName,
      orderDate,
    });
    logAdminNotifyResult("onNewOrder", orderId, result);
  } catch (err) {
    console.error("[onNewOrder] whatsapp failed", err);
  }
}

export async function onOrderProcessing(orderId: string): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return;

  try {
    await sendOrderProcessingEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
    });
  } catch (err) {
    console.error("[onOrderProcessing] email failed", err);
  }

  const { customerPhone, storeName, orderDate } = buildOrderWhatsappMeta(order);

  if (customerPhone) {
    try {
      await notifyOrderProcessing({
        orderId: String(order.id),
        customerName: String(order.customerName),
        customerPhone,
        storeName,
        orderDate,
      });
    } catch (err) {
      console.error("[onOrderProcessing] whatsapp failed", err);
    }
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

  const trackingCode =
    order.trackingCode != null ? String(order.trackingCode) : null;
  const trackingUrl = buildTrackingUrl(
    order.carrier != null ? String(order.carrier) : null,
    trackingCode,
  );

  try {
    await sendOrderShippedEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
      trackingCode,
      trackingUrl,
    });
  } catch (err) {
    console.error("[onOrderShipped] email failed", err);
  }

  const { customerPhone, storeName, orderDate } = buildOrderWhatsappMeta(order);

  try {
    const result = await notifyOrderShipped({
      orderId: String(order.id),
      customerName: String(order.customerName),
      trackingCode,
      customerPhone,
      storeName,
      orderDate,
    });
    logAdminNotifyResult("onOrderShipped", orderId, result);
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

  try {
    await sendOrderDeliveredEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
    });
  } catch (err) {
    console.error("[onOrderDelivered] email failed", err);
  }

  const { customerPhone, storeName, orderDate } = buildOrderWhatsappMeta(order);

  if (customerPhone) {
    try {
      await notifyOrderDelivered({
        orderId: String(order.id),
        customerName: String(order.customerName),
        customerPhone,
        storeName,
        orderDate,
      });
    } catch (err) {
      console.error("[onOrderDelivered] whatsapp failed", err);
    }
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

  const { amountCents, customerPhone, storeName, orderDate } =
    buildOrderWhatsappMeta(order);

  try {
    const result = await notifyOrderCancelled({
      orderId: String(order.id),
      customerName: String(order.customerName),
      amountCents,
      customerPhone,
      storeName,
      orderDate,
    });
    logAdminNotifyResult("onOrderCancelled", orderId, result);
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

  const url =
    trackingUrl ??
    buildTrackingUrl(
      order.carrier != null ? String(order.carrier) : null,
      trackingCode,
    ) ??
    undefined;

  try {
    await sendTrackingEmail({
      to: String(order.customerEmail),
      customerName: String(order.customerName),
      orderId: String(order.id),
      trackingCode,
      trackingUrl: url,
    });
  } catch (err) {
    console.error("[onTrackingUpdate] email failed", err);
  }
}
