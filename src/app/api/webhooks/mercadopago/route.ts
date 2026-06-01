import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { getPaymentById, verifyWebhookSignature } from "@/lib/mercadopago";
import { rateLimitWebhook } from "@/lib/rate-limit";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { onOrderPaid } from "@/lib/hooks/order-paid";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitWebhook(`mp:${ip}`);
  if (!limited.success) return jsonError("Too many requests", 429);

  const rawBody = await request.text();
  const { webhookSecret: secret } = await getMercadoPagoSettingsFromDb();

  if (secret && !(await verifyWebhookSignature(request.headers, rawBody, secret))) {
    return jsonError("Invalid signature", 401);
  }

  let payload: { type?: string; action?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON");
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = String(payload.data.id);
  const idempotencyKey = `mp:webhook:${mpPaymentId}`;
  const seen = await cacheGet(idempotencyKey);
  if (seen) return NextResponse.json({ received: true, duplicate: true });
  await cacheSet(idempotencyKey, "1", 86400);

  const mpPayment = await getPaymentById(mpPaymentId);
  const orderId = mpPayment.external_reference;
  if (!orderId) return NextResponse.json({ received: true });

  const statusMap: Record<string, "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"> = {
    approved: "APPROVED",
    pending: "PENDING",
    in_process: "PENDING",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
  };
  const mpStatus = mpPayment.status ?? "pending";
  const status = statusMap[mpStatus] ?? "PENDING";

  const amountCents = Math.round((mpPayment.transaction_amount ?? 0) * 100);
  const method = mapMpMethod(mpPayment.payment_method_id);

  let payment = await prisma.payment.findFirst({
    where: { mercadoPagoId: mpPaymentId },
  });

  if (!payment) {
    payment = await prisma.payment.findFirst({
      where: { orderId, status: "PENDING", mercadoPagoId: null },
      orderBy: { createdAt: "desc" },
    });
  }

  if (payment) {
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        mercadoPagoId: mpPaymentId,
        status,
        amountCents,
        method,
        metadata: mpPayment as object,
      },
    });
  } else {
    payment = await prisma.payment.create({
      data: {
        orderId,
        mercadoPagoId: mpPaymentId,
        amountCents,
        method,
        status,
        externalReference: orderId,
        metadata: mpPayment as object,
      },
    });
  }

  if (status === "APPROVED") {
    await onOrderPaid(orderId, payment.id);
  }

  return NextResponse.json({ received: true });
}

function mapMpMethod(
  id?: string
): "PIX" | "CREDIT_CARD" | "BOLETO" {
  if (!id) return "CREDIT_CARD";
  if (id.includes("pix")) return "PIX";
  if (id.includes("bol") || id === "bolbradesco") return "BOLETO";
  return "CREDIT_CARD";
}
