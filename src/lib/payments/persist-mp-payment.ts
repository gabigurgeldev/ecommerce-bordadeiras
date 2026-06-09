import { incrementCouponUsageOnPaymentApproved } from "@/lib/payments/coupon-on-payment";
import { onOrderPaid } from "@/lib/hooks/order-paid";
import type { PaymentMethod } from "@/lib/types/database";
import { getDb, newId, TABLES } from "@/lib/supabase/db";

export function mapMpStatusToDb(status: string): string {
  if (status === "approved") return "APPROVED";
  if (status === "rejected" || status === "cancelled") return "REJECTED";
  return "PENDING";
}

export async function finalizeApprovedOrder(
  orderId: string,
  localPaymentId: string,
): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db
    .from(TABLES.Order)
    .update({ status: "PAID", updatedAt: now })
    .eq("id", orderId);

  await incrementCouponUsageOnPaymentApproved(orderId);
  void onOrderPaid(orderId, localPaymentId);
}

async function markOrderPaidIfApproved(
  orderId: string,
  localPaymentId: string,
  mpStatus: string,
): Promise<void> {
  if (mpStatus !== "approved") return;
  await finalizeApprovedOrder(orderId, localPaymentId);
}

export async function persistMpPayment(input: {
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  mpPaymentId: string | number;
  status: string;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const dbStatus = mapMpStatusToDb(input.status);
  const mpId = String(input.mpPaymentId);

  const { data: existing } = await db
    .from(TABLES.Payment)
    .select("id, status, mercadoPagoId")
    .eq("orderId", input.orderId)
    .eq("method", input.method)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db
      .from(TABLES.Payment)
      .update({
        mercadoPagoId: mpId,
        amountCents: input.amountCents,
        status: dbStatus,
        updatedAt: now,
      })
      .eq("id", existing.id);

    await markOrderPaidIfApproved(
      input.orderId,
      String(existing.id),
      input.status,
    );

    return { localPaymentId: String(existing.id), dbStatus };
  }

  const localId = newId();
  await db.from(TABLES.Payment).insert({
    id: localId,
    orderId: input.orderId,
    method: input.method,
    amountCents: input.amountCents,
    status: dbStatus,
    mercadoPagoId: mpId,
    externalReference: input.orderId,
    createdAt: now,
    updatedAt: now,
  });

  await markOrderPaidIfApproved(input.orderId, localId, input.status);

  return { localPaymentId: localId, dbStatus };
}

export async function syncMpPaymentStatus(input: {
  orderId: string;
  mpPaymentId: string | number;
  status: string;
}) {
  const db = getDb();
  const now = new Date().toISOString();
  const dbStatus = mapMpStatusToDb(input.status);

  const { data: payment } = await db
    .from(TABLES.Payment)
    .select("id, status")
    .eq("mercadoPagoId", String(input.mpPaymentId))
    .maybeSingle();

  if (payment && String(payment.status) !== dbStatus) {
    await db
      .from(TABLES.Payment)
      .update({ status: dbStatus, updatedAt: now })
      .eq("id", payment.id);
  }

  if (input.status === "approved" && payment?.id) {
    await markOrderPaidIfApproved(
      input.orderId,
      String(payment.id),
      input.status,
    );
  }

  return { dbStatus, localPaymentId: payment?.id ?? null };
}
