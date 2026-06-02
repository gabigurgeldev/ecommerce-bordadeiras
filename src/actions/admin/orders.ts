"use server";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  onOrderCancelled,
  onOrderDelivered,
  onOrderShipped,
  onTrackingUpdate,
} from "@/lib/hooks/order-notifications";
import { orderUpdateSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listOrders() {
  return withAdminRead(() =>
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, _count: { select: { items: true } } },
    }),
  );
}

export async function getOrder(id: string) {
  return withAdminRead(() =>
    prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true, user: true },
    }),
  );
}

export async function updateOrder(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = orderUpdateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const current = await prisma.order.findUnique({ where: { id } });
    if (!current) return { success: false, error: "Pedido não encontrado" };

    await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status,
        trackingCode: parsed.data.trackingCode ?? null,
        carrier: parsed.data.carrier ?? null,
      },
    });

    const newStatus = parsed.data.status;
    const trackingCode = parsed.data.trackingCode ?? null;

    if (current.status !== newStatus) {
      if (newStatus === OrderStatus.SHIPPED) {
        await onOrderShipped(id);
      } else if (newStatus === OrderStatus.DELIVERED) {
        await onOrderDelivered(id);
      } else if (newStatus === OrderStatus.CANCELLED) {
        await onOrderCancelled(id);
      }
    } else if (trackingCode && trackingCode !== current.trackingCode) {
      await onTrackingUpdate(id, trackingCode);
    }

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
