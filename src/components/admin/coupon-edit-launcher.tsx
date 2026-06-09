"use client";

import { useRouter } from "next/navigation";
import { CouponFormDialog } from "@/components/admin/coupon-form-dialog";
import type { Coupon } from "@/lib/types/database";

export function CouponEditLauncher({ coupon }: { coupon: Coupon }) {
  const router = useRouter();

  return (
    <CouponFormDialog
      coupon={coupon}
      defaultOpen
      onClose={() => router.replace("/admin/cupons")}
    />
  );
}
