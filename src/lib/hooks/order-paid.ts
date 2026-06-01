import { prisma } from "@/lib/prisma";
import { sendOrderConfirmedEmail } from "@/lib/mail";
import { notifyPaymentApproved } from "@/lib/whatsapp-client";

/** Runs when a payment is approved: emails customer + notifies admin via WhatsApp. */
export async function onOrderPaid(orderId: string, paymentId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, payments: true },
  });
  if (!order) return;

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID" },
  });

  const totalCents =
    order.items.reduce((s, i) => s + i.priceCents * i.quantity, 0) + order.shippingCents;

  try {
    await sendOrderConfirmedEmail({
      to: order.customerEmail,
      orderId: order.id,
      customerName: order.customerName,
      totalCents,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        priceCents: i.priceCents,
      })),
    });
  } catch (err) {
    console.error("[onOrderPaid] email failed", err);
  }

  try {
    await notifyPaymentApproved({
      orderId: order.id,
      customerName: order.customerName,
      amountCents: totalCents,
      paymentId,
    });
  } catch (err) {
    console.error("[onOrderPaid] whatsapp failed", err);
  }
}
