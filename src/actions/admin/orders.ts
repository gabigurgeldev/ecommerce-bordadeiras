"use server";

import { prisma } from "@/lib/prisma";
import { orderUpdateSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, type ActionResult } from "./_utils";

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, _count: { select: { items: true } } },
  });
}

export async function getOrder(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: true, user: true },
  });
}

export async function updateOrder(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = orderUpdateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        trackingCode: parsed.data.trackingCode ?? null,
        carrier: parsed.data.carrier ?? null,
      },
    });

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      metadata: parsed.data,
    });
    revalidateAdmin(["/admin/pedidos", `/admin/pedidos/${id}`]);
    return { success: true };
  });
}
