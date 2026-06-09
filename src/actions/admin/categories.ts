"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { categorySchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listCategories() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Category)
      .select("*")
      .order("sortOrder", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function upsertCategory(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const db = getDb();
    const now = new Date().toISOString();
    const { seoTitle, seoDescription, imageUrl, parentId, ...rest } = parsed.data;
    const payload = {
      ...rest,
      imageUrl: imageUrl || null,
      seoTitle: seoTitle?.trim() || null,
      seoDescription: seoDescription?.trim() || null,
      parentId: parentId || null,
      updatedAt: now,
    };
    let rowId = id;

    if (id) {
      const { error } = await db.from(TABLES.Category).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      rowId = newId();
      const { error } = await db.from(TABLES.Category).insert({
        id: rowId,
        ...payload,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Category",
      entityId: rowId!,
    });
    revalidateAdmin(["/admin/categorias"]);
    return { success: true, data: { id: rowId! } };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.Category).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, { action: "DELETE", entity: "Category", entityId: id });
    revalidateAdmin(["/admin/categorias"]);
    return { success: true };
  });
}
