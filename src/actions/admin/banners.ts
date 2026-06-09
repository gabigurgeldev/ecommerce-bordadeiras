"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { bannerSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listBanners() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontBanner)
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function upsertBanner(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = bannerSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.flatten().formErrors.join(", ") || "Dados inválidos",
      };
    }

    const db = getDb();
    const now = new Date().toISOString();
    const payload = {
      title: parsed.data.title,
      imageUrl: parsed.data.desktopImageUrl, // Mantém compatibilidade
      desktopImageUrl: parsed.data.desktopImageUrl,
      mobileImageUrl: parsed.data.mobileImageUrl || null,
      altText: parsed.data.altText || null,
      link: parsed.data.link || null,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate).toISOString() : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate).toISOString() : null,
      updatedAt: now,
    };

    let bannerId = id;
    if (id) {
      const { error } = await db.from(TABLES.StorefrontBanner).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      bannerId = newId();
      const { error } = await db.from(TABLES.StorefrontBanner).insert({
        id: bannerId,
        ...payload,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "StorefrontBanner",
      entityId: bannerId!,
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true, data: { id: bannerId! } };
  });
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.StorefrontBanner).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "DELETE",
      entity: "StorefrontBanner",
      entityId: id,
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}

export async function toggleBannerActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb()
      .from(TABLES.StorefrontBanner)
      .update({ active, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontBanner",
      entityId: id,
      metadata: { active },
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}

export async function reorderBanners(
  orders: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const db = getDb();
    const now = new Date().toISOString();

    for (const { id, sortOrder } of orders) {
      const { error } = await db
        .from(TABLES.StorefrontBanner)
        .update({ sortOrder, updatedAt: now })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontBanner",
      entityId: orders.map((o) => o.id).join(","),
      metadata: { reorder: orders },
    });
    revalidateAdmin(["/admin/banners", "/"]);
    return { success: true };
  });
}
