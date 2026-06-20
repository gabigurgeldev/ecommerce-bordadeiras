import { revalidatePath } from "next/cache";
import { clearServerCartForUser } from "@/lib/data/cart";
import { deductOrderStock } from "@/lib/data/deduct-order-stock";
import { incrementCouponUsageOnPaymentApproved } from "@/lib/payments/coupon-on-payment";
import { onOrderPaid } from "@/lib/hooks/order-paid";
import { scheduleBackground } from "@/lib/schedule-background";
import type { PaymentMethod } from "@/lib/types/database";
import { getDb, newId, TABLES } from "@/lib/supabase/db";

function raiseSupabaseError(error: unknown, fallback: string): never {
  if (error instanceof Error) throw error;
  throw new Error(fallback);
}

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

  const { data: order, error: orderLookupError } = await db
    .from(TABLES.Order)
    .select("userId, status")
    .eq("id", orderId)
    .maybeSingle();
  if (orderLookupError) raiseSupabaseError(orderLookupError, "Order lookup failed");
  if (!order) throw new Error(`Order ${orderId} not found`);

  if (String(order.status) === "PAID") {
    revalidatePath("/admin");
    revalidatePath("/conta/pedidos");
    revalidatePath(`/conta/pedidos/${orderId}`);
    return;
  }

  const { data: paidOrder, error: paidOrderError } = await db
    .from(TABLES.Order)
    .update({ status: "PAID", paidAt: now, updatedAt: now })
    .eq("id", orderId)
    .neq("status", "PAID")
    .select("userId, status")
    .maybeSingle();
  if (paidOrderError) raiseSupabaseError(paidOrderError, "Order paid update failed");
  if (!paidOrder) return;

  if (order?.userId) {
    await clearServerCartForUser(String(order.userId));
  }

  await deductOrderStock(orderId);
  await incrementCouponUsageOnPaymentApproved(orderId);

  scheduleBackground(() => onOrderPaid(orderId, localPaymentId), "onOrderPaid");

  revalidatePath("/admin");
  revalidatePath("/conta/pedidos");
  revalidatePath(`/conta/pedidos/${orderId}`);
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

  const { data: existing, error: existingError } = await db
    .from(TABLES.Payment)
    .select("id, status, mercadoPagoId")
    .eq("orderId", input.orderId)
    .eq("method", input.method)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) raiseSupabaseError(existingError, "Payment lookup failed");

  if (existing) {
    const { error: updateError } = await db
      .from(TABLES.Payment)
      .update({
        mercadoPagoId: mpId,
        amountCents: input.amountCents,
        status: dbStatus,
        updatedAt: now,
      })
      .eq("id", existing.id);
    if (updateError) raiseSupabaseError(updateError, "Payment update failed");

    await markOrderPaidIfApproved(
      input.orderId,
      String(existing.id),
      input.status,
    );

    return { localPaymentId: String(existing.id), dbStatus };
  }

  const localId = newId();
  const { error: insertError } = await db.from(TABLES.Payment).insert({
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
  if (insertError) raiseSupabaseError(insertError, "Payment insert failed");

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

  const { data: payment, error: paymentLookupError } = await db
    .from(TABLES.Payment)
    .select("id, status")
    .eq("mercadoPagoId", String(input.mpPaymentId))
    .maybeSingle();
  if (paymentLookupError) raiseSupabaseError(paymentLookupError, "Payment lookup failed");

  if (payment && String(payment.status) !== dbStatus) {
    const { error: updateError } = await db
      .from(TABLES.Payment)
      .update({ status: dbStatus, updatedAt: now })
      .eq("id", payment.id);
    if (updateError) raiseSupabaseError(updateError, "Payment status update failed");
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
