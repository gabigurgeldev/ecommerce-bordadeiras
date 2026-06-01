"use server";

import { prisma } from "@/lib/prisma";
import { couponSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, type ActionResult } from "./_utils";

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}

export async function upsertCoupon(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = couponSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const payload = {
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minCents: parsed.data.minCents ?? null,
      validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : null,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      maxUses: parsed.data.maxUses ?? null,
      active: parsed.data.active,
    };

    const coupon = id
      ? await prisma.coupon.update({ where: { id }, data: payload })
      : await prisma.coupon.create({ data: payload });

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Coupon",
      entityId: coupon.id,
    });
    revalidateAdmin(["/admin/cupons"]);
    return { success: true, data: { id: coupon.id } };
  });
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.coupon.delete({ where: { id } });
    await auditMutation(actor, { action: "DELETE", entity: "Coupon", entityId: id });
    revalidateAdmin(["/admin/cupons"]);
    return { success: true };
  });
}
