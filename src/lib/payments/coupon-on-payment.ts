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

  const { data: coupon, error: couponError } = await db
    .from(TABLES.Coupon)
    .select("usedCount")
    .eq("id", couponId)
    .maybeSingle();
  if (couponError) raiseSupabaseError(couponError, "Coupon lookup failed");

  if (!coupon) return;

  const { error: updateError } = await db
    .from(TABLES.Coupon)
    .update({
      usedCount: Number(coupon.usedCount) + 1,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", couponId);
  if (updateError) raiseSupabaseError(updateError, "Coupon usage update failed");
}
