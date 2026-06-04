"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { trustBarItemSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listTrustBarItems() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontTrustItem)
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function upsertTrustBarItem(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = trustBarItemSchema.safeParse(data);
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
      description: parsed.data.description,
      icon: parsed.data.icon,
      link: parsed.data.link || null,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
      updatedAt: now,
    };

    let itemId = id;
    if (id) {
      const { error } = await db.from(TABLES.StorefrontTrustItem).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      itemId = newId();
      const { error } = await db.from(TABLES.StorefrontTrustItem).insert({
        id: itemId,
        ...payload,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "StorefrontTrustItem",
      entityId: itemId!,
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true, data: { id: itemId! } };
  });
}

export async function deleteTrustBarItem(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.StorefrontTrustItem).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "DELETE",
      entity: "StorefrontTrustItem",
      entityId: id,
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true };
  });
}

export async function toggleTrustBarItemActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb()
      .from(TABLES.StorefrontTrustItem)
      .update({ active, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontTrustItem",
      entityId: id,
      metadata: { active },
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true };
  });
}

export async function reorderTrustBarItems(
  orders: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const db = getDb();
    const now = new Date().toISOString();
    for (const { id, sortOrder } of orders) {
      await db
        .from(TABLES.StorefrontTrustItem)
        .update({ sortOrder, updatedAt: now })
        .eq("id", id);
    }
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontTrustItem",
      metadata: { reorder: orders.length },
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true };
  });
}
