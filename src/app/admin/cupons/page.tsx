import { listCoupons } from "@/actions/admin/coupons";
import { PageHeader } from "@/components/admin/page-header";
import { CouponsList, CouponsListHeaderAction } from "@/components/admin/coupons-list";

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Descontos e campanhas promocionais"
        actions={<CouponsListHeaderAction />}
      />
      <CouponsList
        coupons={coupons.map((c) => ({
          id: c.id as string,
          code: c.code as string,
          type: c.type as string,
          value: Number(c.value),
          minCents: c.minCents != null ? Number(c.minCents) : null,
          validFrom: c.validFrom as string | null,
          validUntil: c.validUntil as string | null,
          active: Boolean(c.active),
          usedCount: Number(c.usedCount),
          maxUses: c.maxUses != null ? Number(c.maxUses) : null,
        }))}
      />
    </div>
  );
}
