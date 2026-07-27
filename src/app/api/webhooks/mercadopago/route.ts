import { NextResponse } from "next/server";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { getPaymentById, verifyWebhookSignature } from "@/lib/mercadopago";
import { rateLimitWebhook } from "@/lib/rate-limit";
import { getClientIp, jsonError } from "@/lib/api-utils";
import { sanitizeMercadoPagoPaymentMetadata } from "@/lib/payments/mercadopago-metadata";
import {
  finalizeApprovedOrder,
  orderAmountMatches,
} from "@/lib/payments/persist-mp-payment";
import {
  claimWebhookEvent,
  markWebhookEvent,
} from "@/lib/payments/webhook-event-ledger";

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

  let payload: {
    id?: string | number;
    type?: string;
    action?: string;
    data?: { id?: string };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON");
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const mpPaymentId = String(payload.data.id);

  // Durable idempotency: one row per notification, claimed before any side
  // effect. Keyed on the notification id (not the payment id) so the later
  // "approved" notification for a payment that first arrived "pending" is still
  // processed.
  const eventId = payload.id
    ? String(payload.id)
    : `${mpPaymentId}:${payload.action ?? payload.type}`;

  const claim = await claimWebhookEvent({
    eventId,
    eventType: payload.type,
    action: payload.action,
    resourceId: mpPaymentId,
    payload,
  });
  if (!claim.claimed) {
    if (claim.reason === "in-progress") {
      return jsonError("Webhook already processing", 409);
    }
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    const mpPayment = await getPaymentById(mpPaymentId);
    const orderId = mpPayment.external_reference;
    if (!orderId) {
      await markWebhookEvent(claim.id, "PROCESSED");
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
    const mappedStatus = statusMap[mpStatus] ?? "PENDING";

    const amountCents = Math.round((mpPayment.transaction_amount ?? 0) * 100);
    const method = mapMpMethod(mpPayment.payment_method_id);

    const db = getDb();
    const now = new Date().toISOString();

    // The deduct_stock_on_payment trigger fires on the Payment write, so the
    // amount has to be validated before anything is stored as APPROVED.
    const amountMismatch =
      mappedStatus === "APPROVED" &&
      !(await orderAmountMatches(orderId, amountCents));
    if (amountMismatch) {
      console.error("[webhook] amount mismatch", {
        orderId,
        amountCents,
        mpPaymentId,
      });
    }

    const status = amountMismatch ? "PENDING" : mappedStatus;

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
      await finalizeApprovedOrder(orderId, String(payment.id));
    }

    await markWebhookEvent(claim.id, "PROCESSED", {
      paymentId: payment ? String(payment.id) : null,
    });

    if (amountMismatch) {
      return NextResponse.json({ received: true, amountMismatch: true });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    // Leave the event FAILED so Mercado Pago's retry can claim it again.
    await markWebhookEvent(claim.id, "FAILED", {
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}

function mapMpMethod(id?: string): "PIX" | "CREDIT_CARD" | "BOLETO" {
  if (!id) return "CREDIT_CARD";
  if (id.includes("pix")) return "PIX";
  if (id.includes("bol") || id === "bolbradesco") return "BOLETO";
  return "CREDIT_CARD";
}
