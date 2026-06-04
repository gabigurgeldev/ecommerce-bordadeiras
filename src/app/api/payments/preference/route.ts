import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { createPaymentPreference } from "@/lib/mercadopago";
import { jsonError, parseBody } from "@/lib/api-utils";
import { sanitizeEmail } from "@/lib/sanitize";
import type { PaymentMethod } from "@/lib/types/database";

const schema = z.object({
  orderId: z.string().cuid(),
  method: z.enum(["PIX", "CREDIT_CARD", "BOLETO"]),
  customerEmail: z.string().email().optional(),
});

function canAccessOrder(
  order: { userId: string | null; customerEmail: string },
  sessionUserId: string | undefined,
  customerEmail: string | undefined,
): boolean {
  if (order.userId) {
    return sessionUserId === order.userId;
  }
  if (!customerEmail) return false;
  return sanitizeEmail(customerEmail) === sanitizeEmail(order.customerEmail);
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const db = getDb();
  const { data: order, error } = await db
    .from(TABLES.Order)
    .select("*, OrderItem(*)")
    .eq("id", parsed.data.orderId)
    .maybeSingle();

  if (error || !order) return jsonError("Order not found", 404);

  if (
    !canAccessOrder(
      { userId: order.userId as string | null, customerEmail: String(order.customerEmail) },
      sessionUser?.id,
      parsed.data.customerEmail,
    )
  ) {
    return jsonError("Forbidden", 403);
  }

  const items = (order.OrderItem as Record<string, unknown>[]) ?? [];
  const amountCents =
    items.reduce((s, i) => s + Number(i.priceCents) * Number(i.quantity), 0) +
    Number(order.shippingCents);

  const preference = await createPaymentPreference({
    orderId: String(order.id),
    title: `Pedido #${String(order.id).slice(-8)}`,
    amountCents,
    payerEmail: String(order.customerEmail),
    method: parsed.data.method as PaymentMethod,
  });

  const now = new Date().toISOString();
  const paymentId = newId();
  const { data: payment, error: payError } = await db
    .from(TABLES.Payment)
    .insert({
      id: paymentId,
      orderId: order.id,
      method: parsed.data.method,
      amountCents,
      status: "PENDING",
      mercadoPagoPrefId: preference.id,
      externalReference: String(order.id),
      createdAt: now,
      updatedAt: now,
    })
    .select("id")
    .single();

  if (payError || !payment) return jsonError("Failed to create payment", 500);

  return NextResponse.json({
    preferenceId: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
    paymentId: payment.id,
  });
}
