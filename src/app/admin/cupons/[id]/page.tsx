import { notFound } from "next/navigation";
import { CouponForm } from "@/components/admin/coupon-form";
import { getDb, TABLES } from "@/lib/supabase/db";

type Props = { params: Promise<{ id: string }> };

export default async function EditCouponPage({ params }: Props) {
  const { id } = await params;
  const { data: coupon } = await getDb()
    .from(TABLES.Coupon)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!coupon) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Editar cupom</h1>
      <CouponForm coupon={coupon} />
    </div>
  );
}
