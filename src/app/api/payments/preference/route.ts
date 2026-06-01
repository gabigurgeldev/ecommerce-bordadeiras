import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createPaymentPreference } from "@/lib/mercadopago";
import { jsonError, parseBody } from "@/lib/api-utils";
import type { PaymentMethod } from "@prisma/client";

const schema = z.object({
  orderId: z.string().cuid(),
  method: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { items: true, payments: true },
  });
  if (!order) return jsonError("Order not found", 404);
  if (order.userId && order.userId !== session.user.id) {
    return jsonError("Forbidden", 403);
  }

  const amountCents =
    order.items.reduce((s, i) => s + i.priceCents * i.quantity, 0) + order.shippingCents;

  const preference = await createPaymentPreference({
    orderId: order.id,
    title: `Pedido #${order.id.slice(-8)}`,
    amountCents,
    payerEmail: order.customerEmail,
    method: parsed.data.method as PaymentMethod,
  });

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      method: parsed.data.method as PaymentMethod,
      amountCents,
      status: "PENDING",
      mercadoPagoPrefId: preference.id,
      externalReference: order.id,
    },
  });

  return NextResponse.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    paymentId: payment.id,
  });
}
