"use server";

import { getDb, newId, TABLES, toIso } from "@/lib/supabase/db";
import { couponSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listCoupons() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Coupon)
      .select("*")
      .order("createdAt", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function getCoupon(id: string) {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Coupon)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
}

export async function upsertCoupon(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = couponSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const db = getDb();
    const now = new Date().toISOString();
    const payload = {
      code: parsed.data.code,
      type: parsed.data.type,
      value: parsed.data.value,
      minCents: parsed.data.minCents ?? null,
      validFrom: parsed.data.validFrom ? toIso(new Date(parsed.data.validFrom)) : null,
      validUntil: parsed.data.validUntil ? toIso(new Date(parsed.data.validUntil)) : null,
      maxUses: parsed.data.maxUses ?? null,
      active: parsed.data.active,
      updatedAt: now,
    };

    let couponId = id;
    if (id) {
      const { error } = await db.from(TABLES.Coupon).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      couponId = newId();
      const { error } = await db.from(TABLES.Coupon).insert({
        id: couponId,
        ...payload,
        usedCount: 0,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Coupon",
      entityId: couponId!,
    });
    revalidateAdmin(["/admin/cupons"]);
    return { success: true, data: { id: couponId! } };
  });
}

export async function deleteCoupon(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.Coupon).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, { action: "DELETE", entity: "Coupon", entityId: id });
    revalidateAdmin(["/admin/cupons"]);
    return { success: true };
  });
}
