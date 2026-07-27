import { getDb, TABLES } from "@/lib/supabase/db";

function raiseSupabaseError(error: unknown, fallback: string): never {
  if (error instanceof Error) throw error;
  throw new Error(fallback);
}

/** Incrementa usedCount do cupom do pedido quando o pagamento é aprovado. */
export async function incrementCouponUsageOnPaymentApproved(
  orderId: string,
): Promise<void> {
  const db = getDb();
  const { data: order, error: orderError } = await db
    .from(TABLES.Order)
    .select("couponId")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) raiseSupabaseError(orderError, "Order coupon lookup failed");

  const couponId = order?.couponId ? String(order.couponId) : null;
  if (!couponId) return;

  // Atomic increment guarded by maxUses (see increment_coupon_usage migration).
  // A read-modify-write here let concurrent approvals redeem past the limit.
  const { data: incremented, error: updateError } = await db.rpc(
    "increment_coupon_usage",
    { coupon_id: couponId },
  );
  if (updateError) raiseSupabaseError(updateError, "Coupon usage update failed");

  if (incremented === false) {
    console.warn("[coupon] usage not incremented (missing or exhausted)", {
      orderId,
      couponId,
    });
  }
}
