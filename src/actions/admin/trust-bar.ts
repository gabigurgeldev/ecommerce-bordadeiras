"use server";

import { prisma } from "@/lib/prisma";
import { trustBarItemSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listTrustBarItems() {
  return withAdminRead(() =>
    prisma.storefrontTrustItem.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  );
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

    const payload = {
      title: parsed.data.title,
      description: parsed.data.description,
      icon: parsed.data.icon,
      link: parsed.data.link || null,
      sortOrder: parsed.data.sortOrder,
      active: parsed.data.active,
    };

    const item = id
      ? await prisma.storefrontTrustItem.update({ where: { id }, data: payload })
      : await prisma.storefrontTrustItem.create({ data: payload });

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "StorefrontTrustItem",
      entityId: item.id,
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true, data: { id: item.id } };
  });
}

export async function deleteTrustBarItem(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.storefrontTrustItem.delete({ where: { id } });
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
    await prisma.storefrontTrustItem.update({ where: { id }, data: { active } });
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
    await prisma.$transaction(
      orders.map(({ id, sortOrder }) =>
        prisma.storefrontTrustItem.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    await auditMutation(actor, {
      action: "UPDATE",
      entity: "StorefrontTrustItem",
      metadata: { reorder: orders.length },
    });
    revalidateAdmin(["/admin/confianca", "/"]);
    return { success: true };
  });
}
