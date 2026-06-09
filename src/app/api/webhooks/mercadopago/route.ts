import { NextResponse } from "next/server";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { getPaymentById, verifyWebhookSignature } from "@/lib/mercadopago";
import { rateLimitWebhook } from "@/lib/rate-limit";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { finalizeApprovedOrder } from "@/lib/payments/persist-mp-payment";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = await rateLimitWebhook(`mp:${ip}`);
  if (!limited.success) return jsonError("Too many requests", 429);

  const rawBody = await request.text();
  const { webhookSecret: secret } = await getMercadoPagoSettingsFromDb();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !secret) {
    console.error("[webhook] Mercado Pago webhook secret not configured");
    return jsonError("Webhook not configured", 503);
  }

  if (secret) {
    if (!(await verifyWebhookSignature(request.headers, rawBody, secret))) {
      return jsonError("Invalid signature", 401);
    }
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

  const db = getDb();
  const now = new Date().toISOString();

  let { data: payment } = await db
    .from(TABLES.Payment)
    .select("*")
    .eq("mercadoPagoId", mpPaymentId)
    .maybeSingle();

  if (!payment) {
    const { data: pending } = await db
      .from(TABLES.Payment)
      .select("*")
      .eq("orderId", orderId)
      .eq("status", "PENDING")
      .is("mercadoPagoId", null)
      .order("createdAt", { ascending: false })
      .limit(1)
      .maybeSingle();
    payment = pending;
  }

  const payPayload = {
    mercadoPagoId: mpPaymentId,
    status,
    amountCents,
    method,
    metadata: mpPayment as object,
    updatedAt: now,
  };

  if (payment) {
    const { data: updated } = await db
      .from(TABLES.Payment)
      .update(payPayload)
      .eq("id", payment.id)
      .select("*")
      .single();
    payment = updated;
  } else {
    const id = newId();
    const { data: created } = await db
      .from(TABLES.Payment)
      .insert({
        id,
        orderId,
        ...payPayload,
        externalReference: orderId,
        createdAt: now,
      })
      .select("*")
      .single();
    payment = created;
  }

  if (status === "APPROVED" && payment) {
    const { data: order } = await db
      .from(TABLES.Order)
      .select("totalCents")
      .eq("id", orderId)
      .maybeSingle();

    const orderTotal = Number(order?.totalCents ?? 0);
    if (!order || orderTotal !== amountCents) {
      console.error("[webhook] amount mismatch", {
        orderId,
        orderTotal,
        amountCents,
        mpPaymentId,
      });
      return NextResponse.json({ received: true, amountMismatch: true });
    }

    await finalizeApprovedOrder(orderId, String(payment.id));
  }

  return NextResponse.json({ received: true });
}

function mapMpMethod(id?: string): "PIX" | "CREDIT_CARD" | "BOLETO" {
  if (!id) return "CREDIT_CARD";
  if (id.includes("pix")) return "PIX";
  if (id.includes("bol") || id === "bolbradesco") return "BOLETO";
  return "CREDIT_CARD";
}
