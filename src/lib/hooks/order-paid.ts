import { getDb, TABLES } from "@/lib/supabase/db";
import { sendOrderConfirmedEmail } from "@/lib/mail";
import { notifyPaymentApproved } from "@/lib/whatsapp-client";

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

  await db.from(TABLES.Order).update({ status: "PAID" }).eq("id", orderId);

  const orderItems = items ?? [];
  const totalCents =
    orderItems.reduce(
      (s, i) => s + Number(i.priceCents) * Number(i.quantity),
      0,
    ) + Number(order.shippingCents);

  try {
    await sendOrderConfirmedEmail({
      to: String(order.customerEmail),
      orderId: String(order.id),
      customerName: String(order.customerName),
      totalCents,
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
    await notifyPaymentApproved({
      orderId: String(order.id),
      customerName: String(order.customerName),
      amountCents: totalCents,
      paymentId,
      customerPhone: order.customerPhone,
    });
  } catch (err) {
    console.error("[onOrderPaid] whatsapp failed", err);
  }
}
