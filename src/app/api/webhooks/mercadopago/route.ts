import { NextResponse } from "next/server";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { getPaymentById, verifyWebhookSignature } from "@/lib/mercadopago";
import { rateLimitWebhook } from "@/lib/rate-limit";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { sanitizeMercadoPagoPaymentMetadata } from "@/lib/payments/mercadopago-metadata";
import { finalizeApprovedOrder } from "@/lib/payments/persist-mp-payment";
import { cacheDelete, cacheGet, cacheSet, cacheSetIfAbsent } from "@/lib/redis";

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
  if (isProduction && !process.env.REDIS_URL) {
    console.error("[webhook] REDIS_URL is required for Mercado Pago webhook idempotency");
    return jsonError("Webhook idempotency not configured", 503);
  }

  const idempotencyKey = `mp:webhook:${mpPaymentId}`;
  const seen = await cacheGet(idempotencyKey);
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  const processingLockKey = `${idempotencyKey}:processing`;
  const lockAcquired = await cacheSetIfAbsent(processingLockKey, "1", 300);
  if (!lockAcquired) return jsonError("Webhook already processing", 409);

  try {
    const mpPayment = await getPaymentById(mpPaymentId);
    const orderId = mpPayment.external_reference;
    if (!orderId) {
      await cacheSet(idempotencyKey, "1", 86400);
      return NextResponse.json({ received: true });
    }

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

    const { data: existingPayment, error: paymentLookupError } = await db
      .from(TABLES.Payment)
      .select("*")
      .eq("mercadoPagoId", mpPaymentId)
      .maybeSingle();
    if (paymentLookupError) throw paymentLookupError;

    let payment = existingPayment;
    if (!payment) {
      const { data: pending, error: pendingError } = await db
        .from(TABLES.Payment)
        .select("*")
        .eq("orderId", orderId)
        .eq("status", "PENDING")
        .is("mercadoPagoId", null)
        .order("createdAt", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (pendingError) throw pendingError;
      payment = pending;
    }

    const payPayload = {
      mercadoPagoId: mpPaymentId,
      status,
      amountCents,
      method,
      metadata: sanitizeMercadoPagoPaymentMetadata(mpPayment),
      updatedAt: now,
    };

    if (payment) {
      const { data: updated, error: updateError } = await db
        .from(TABLES.Payment)
        .update(payPayload)
        .eq("id", payment.id)
        .select("*")
        .single();
      if (updateError || !updated) throw updateError ?? new Error("Payment update returned no row");
      payment = updated;
    } else {
      const id = newId();
      const { data: created, error: insertError } = await db
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
      if (insertError || !created) throw insertError ?? new Error("Payment insert returned no row");
      payment = created;
    }

    if (status === "APPROVED" && payment) {
      const { data: order, error: orderError } = await db
        .from(TABLES.Order)
        .select("totalCents")
        .eq("id", orderId)
        .maybeSingle();
      if (orderError) throw orderError;

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

    // TODO(security): persist Mercado Pago event ids in a webhook_events table
    // when migrations are available. Until then, Redis idempotency is marked only
    // after successful processing so transient failures can be retried safely.
    await cacheSet(idempotencyKey, "1", 86400);

    return NextResponse.json({ received: true });
  } finally {
    await cacheDelete(processingLockKey);
  }
}

function mapMpMethod(id?: string): "PIX" | "CREDIT_CARD" | "BOLETO" {
  if (!id) return "CREDIT_CARD";
  if (id.includes("pix")) return "PIX";
  if (id.includes("bol") || id === "bolbradesco") return "BOLETO";
  return "CREDIT_CARD";
}
