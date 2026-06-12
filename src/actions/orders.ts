"use server";

import { getSessionUser } from "@/lib/auth/session";
import { getOrderForUser, getOrdersForUser } from "@/lib/data/orders";
import { onOrderDelivered } from "@/lib/hooks/order-notifications";
import {
  canTransitionOrderStatus,
  statusTimestampField,
} from "@/lib/order-status-transitions";
import { scheduleBackground } from "@/lib/schedule-background";
import { getDb, TABLES } from "@/lib/supabase/db";
import { OrderStatus } from "@/lib/types/database";
import { revalidatePath } from "next/cache";

export type ConfirmOrderDeliveredResult =
  | { ok: true }
  | { ok: false; error: string };

/** Requires Supabase session — userId never accepted from client. */
export async function fetchUserOrders() {
  const user = await getSessionUser();
  const userId = user?.id;
  if (!userId) return [];
  return getOrdersForUser(userId);
}

export async function fetchUserOrder(orderId: string) {
  const user = await getSessionUser();
  const userId = user?.id;
  if (!userId) return null;
  return getOrderForUser(userId, orderId);
}

/** Cliente confirma recebimento — apenas SHIPPED → DELIVERED. */
export async function confirmOrderDelivered(
  orderId: string,
): Promise<ConfirmOrderDeliveredResult> {
  const user = await getSessionUser();
  if (!user?.id) return { ok: false, error: "Não autenticado" };

  const db = getDb();
  const { data: order, error: findErr } = await db
    .from(TABLES.Order)
    .select("id, status, userId")
    .eq("id", orderId)
    .eq("userId", user.id)
    .maybeSingle();

  if (findErr || !order) {
    return { ok: false, error: "Pedido não encontrado" };
  }

  const currentStatus = order.status as OrderStatus;
  if (currentStatus !== OrderStatus.SHIPPED) {
    return {
      ok: false,
      error: "Só é possível confirmar entrega de pedidos já enviados",
    };
  }

  if (
    !canTransitionOrderStatus(currentStatus, OrderStatus.DELIVERED)
  ) {
    return { ok: false, error: "Não é possível atualizar o status deste pedido" };
  }

  const now = new Date().toISOString();
  const tsField = statusTimestampField(OrderStatus.DELIVERED);
  const patch: Record<string, unknown> = {
    status: OrderStatus.DELIVERED,
    updatedAt: now,
  };
  if (tsField) patch[tsField] = now;

  const { data: updated, error: updateErr } = await db
    .from(TABLES.Order)
    .update(patch)
    .eq("id", orderId)
    .eq("userId", user.id)
    .eq("status", OrderStatus.SHIPPED)
    .select("id")
    .maybeSingle();

  if (updateErr) {
    return { ok: false, error: updateErr.message };
  }
  if (!updated) {
    return { ok: false, error: "O status do pedido já foi atualizado" };
  }

  scheduleBackground(() => onOrderDelivered(orderId), "onOrderDelivered");

  revalidatePath("/conta/pedidos");
  revalidatePath(`/conta/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);

  return { ok: true };
}
