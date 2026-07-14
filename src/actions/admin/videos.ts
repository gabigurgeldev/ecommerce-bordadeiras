"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { videoSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listVideos() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.StorefrontVideo)
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("createdAt", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function upsertVideo(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = videoSchema.safeParse(data);
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
      description: parsed.data.description?.trim() || null,
      url: parsed.data.url.trim(),
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
      updatedAt: now,
    };

    let videoId = id;
    if (id) {
      const { error } = await db.from(TABLES.StorefrontVideo).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      videoId = newId();
      const { error } = await db.from(TABLES.StorefrontVideo).insert({
        id: videoId,
        ...payload,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "StorefrontVideo",
      entityId: videoId!,
    });
    revalidateAdmin(["/admin/videos", "/videos"]);
    return { success: true, data: { id: videoId! } };
  });
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.StorefrontVideo).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "DELETE",
      entity: "StorefrontVideo",
      entityId: id,
    });
    revalidateAdmin(["/admin/videos", "/videos"]);
    return { success: true };
  });
}

export async function toggleVideoActive(
  id: string,
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb()
      .from(TABLES.StorefrontVideo)
      .update({ active, updatedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontVideo",
      entityId: id,
      metadata: { active },
    });
    revalidateAdmin(["/admin/videos", "/videos"]);
    return { success: true };
  });
}

export async function reorderVideos(
  orders: { id: string; sortOrder: number }[],
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const db = getDb();
    const now = new Date().toISOString();

    for (const { id, sortOrder } of orders) {
      const { error } = await db
        .from(TABLES.StorefrontVideo)
        .update({ sortOrder, updatedAt: now })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontVideo",
      entityId: orders.map((o) => o.id).join(","),
      metadata: { reorder: orders },
    });
    revalidateAdmin(["/admin/videos", "/videos"]);
    return { success: true };
  });
}
