import { notFound } from "next/navigation";
import { getCoupon } from "@/actions/admin/coupons";
import { CouponEditLauncher } from "@/components/admin/coupon-edit-launcher";
import type { CouponType } from "@/lib/types/database";

type Props = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params;
  const coupon = await getCoupon(id);
  if (!coupon) notFound();

  return (
    <CouponEditLauncher
      coupon={{
        id: coupon.id as string,
        code: coupon.code as string,
        type: coupon.type as CouponType,
        value: Number(coupon.value),
        minCents: coupon.minCents != null ? Number(coupon.minCents) : null,
        validFrom: coupon.validFrom ? new Date(coupon.validFrom as string) : null,
        validUntil: coupon.validUntil ? new Date(coupon.validUntil as string) : null,
        maxUses: coupon.maxUses != null ? Number(coupon.maxUses) : null,
        usedCount: Number(coupon.usedCount),
        active: Boolean(coupon.active),
        createdAt: new Date(coupon.createdAt as string),
        updatedAt: new Date(coupon.updatedAt as string),
      }}
    />
  );
}
