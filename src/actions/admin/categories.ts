"use server";

import { prisma } from "@/lib/prisma";
import { categorySchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listCategories() {
  return withAdminRead(() =>
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  );
}

export async function upsertCategory(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = categorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const payload = {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || null,
      parentId: parsed.data.parentId || null,
    };

    const category = id
      ? await prisma.category.update({ where: { id }, data: payload })
      : await prisma.category.create({ data: payload });

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Category",
      entityId: category.id,
    });
    revalidateAdmin(["/admin/categorias"]);
    return { success: true, data: { id: category.id } };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.category.delete({ where: { id } });
    await auditMutation(actor, { action: "DELETE", entity: "Category", entityId: id });
    revalidateAdmin(["/admin/categorias"]);
    return { success: true };
  });
}
