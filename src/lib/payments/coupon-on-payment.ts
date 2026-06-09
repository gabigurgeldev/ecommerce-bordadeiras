import { getDb, TABLES } from "@/lib/supabase/db";

/** Incrementa usedCount do cupom do pedido quando o pagamento é aprovado. */
export async function incrementCouponUsageOnPaymentApproved(
  orderId: string,
): Promise<void> {
  const db = getDb();
  const { data: order } = await db
    .from(TABLES.Order)
    .select("couponId")
    .eq("id", orderId)
    .maybeSingle();

  const couponId = order?.couponId ? String(order.couponId) : null;
  if (!couponId) return;

  const { data: coupon } = await db
    .from(TABLES.Coupon)
    .select("usedCount")
    .eq("id", couponId)
    .maybeSingle();

  if (!coupon) return;

  await db
    .from(TABLES.Coupon)
    .update({
      usedCount: Number(coupon.usedCount) + 1,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", couponId);
}
