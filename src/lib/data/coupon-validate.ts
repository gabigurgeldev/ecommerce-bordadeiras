import { getDb, TABLES } from "@/lib/supabase/db";
import { CouponType } from "@/lib/types/database";

export type CouponValidation = {
  couponId: string;
  code: string;
  discountCents: number;
};

export async function validateCouponCode(
  code: string,
  subtotalCents: number,
): Promise<
  { ok: true; coupon: CouponValidation } | { ok: false; error: string }
> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false, error: "Informe um cupom" };
  }

  const { data: coupon, error } = await getDb()
    .from(TABLES.Coupon)
    .select("*")
    .eq("code", normalized)
    .eq("active", true)
    .maybeSingle();

  if (error || !coupon) {
    return { ok: false, error: "Cupom inválido ou expirado" };
  }

  const now = new Date();
  if (coupon.validFrom && new Date(String(coupon.validFrom)) > now) {
    return { ok: false, error: "Cupom ainda não está válido" };
  }
  if (coupon.validUntil && new Date(String(coupon.validUntil)) < now) {
    return { ok: false, error: "Cupom expirado" };
  }
  if (coupon.maxUses != null && Number(coupon.usedCount) >= Number(coupon.maxUses)) {
    return { ok: false, error: "Cupom esgotado" };
  }
  if (coupon.minCents != null && subtotalCents < Number(coupon.minCents)) {
    return {
      ok: false,
      error: `Pedido mínimo de R$ ${(Number(coupon.minCents) / 100).toFixed(2)} para este cupom`,
    };
  }

  let discountCents = 0;
  if (coupon.type === CouponType.PERCENT) {
    discountCents = Math.round(subtotalCents * (Number(coupon.value) / 100));
  } else {
    discountCents = Number(coupon.value);
  }
  discountCents = Math.min(discountCents, subtotalCents);

  return {
    ok: true,
    coupon: {
      couponId: String(coupon.id),
      code: String(coupon.code),
      discountCents,
    },
  };
}
