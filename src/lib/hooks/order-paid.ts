import { getDb, TABLES } from "@/lib/supabase/db";
import { sendOrderConfirmedEmail } from "@/lib/mail";
import { notifyPaymentApproved } from "@/lib/whatsapp-client";
import { buildOrderWhatsappMeta } from "@/lib/hooks/order-whatsapp-helpers";
import { logAdminNotifyResult } from "@/lib/whatsapp-notify-types";

/** Runs when a payment is approved: emails customer + notifies admin via WhatsApp. */
export async function onOrderPaid(orderId: string, paymentId: string): Promise<void> {
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

  const orderItems = items ?? [];
  const { amountCents, storeName, orderDate, customerPhone } =
    buildOrderWhatsappMeta(order);

  try {
    await sendOrderConfirmedEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
      totalCents: amountCents,
      items: orderItems.map((i) => ({
        name: String(i.name),
        quantity: Number(i.quantity),
        priceCents: Number(i.priceCents),
      })),
    });
  } catch (err) {
    console.error("[onOrderPaid] email failed", err);
  }

  try {
    const result = await notifyPaymentApproved({
      orderId: String(order.id),
      customerName: String(order.customerName),
      amountCents,
      paymentId,
      customerPhone,
      storeName,
      orderDate,
    });
    logAdminNotifyResult("onOrderPaid", orderId, result);
  } catch (err) {
    console.error("[onOrderPaid] whatsapp failed", err);
  }
}
