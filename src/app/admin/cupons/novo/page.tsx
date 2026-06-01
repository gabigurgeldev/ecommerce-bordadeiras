import { PageHeader } from "@/components/admin/page-header";
import { CouponForm } from "@/components/admin/coupon-form";

export default function NewCouponPage() {
  return (
    <div>
      <PageHeader title="Novo cupom" />
      <CouponForm />
    </div>
  );
}
