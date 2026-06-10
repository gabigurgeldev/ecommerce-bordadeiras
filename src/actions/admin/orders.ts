"use server";

import type { Order, OrderItem, Payment } from "@/lib/types/database";
import { OrderStatus } from "@/lib/types/database";
import { getDb, TABLES } from "@/lib/supabase/db";
import {
  onOrderCancelled,
  onOrderDelivered,
  onOrderProcessing,
  onOrderShipped,
  onTrackingUpdate,
} from "@/lib/hooks/order-notifications";
import {
  statusTimestampField,
  validateOrderStatusUpdate,
} from "@/lib/order-status-transitions";
import { buildTrackingUrl } from "@/lib/tracking-url";
import { orderUpdateSchema } from "@/lib/validations/admin";
import { revalidatePath } from "next/cache";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listOrders() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Order)
      .select("*, OrderItem(id), Payment(method, status)")
      .order("createdAt", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export type OrderWithRelations = Order & {
  orderNumber?: string;
  carrier?: string | null;
  shippingAddress?: Record<string, unknown> | null;
  shippingServiceName?: string | null;
  items: OrderItem[];
  payments: Payment[];
  user?: Record<string, unknown> | null;
};

function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  return new Date(String(value));
}

function normalizeOrder(row: Record<string, unknown>): OrderWithRelations {
  const items = (row.OrderItem as Record<string, unknown>[]) ?? [];
  const payments = (row.Payment as Record<string, unknown>[]) ?? [];
  const base = row as unknown as Order;
  return {
    ...base,
    id: String(row.id),
    orderNumber: String(row.orderNumber),
    customerName: String(row.customerName),
    customerEmail: String(row.customerEmail),
    customerPhone: row.customerPhone != null ? String(row.customerPhone) : null,
    totalCents: Number(row.totalCents),
    subtotalCents: Number(row.subtotalCents),
    shippingCents: Number(row.shippingCents),
    discountCents: Number(row.discountCents),
    status: row.status as Order["status"],
    trackingCode: row.trackingCode != null ? String(row.trackingCode) : null,
    carrier: row.carrier != null ? String(row.carrier) : null,
    paidAt: parseDate(row.paidAt),
    processingAt: parseDate(row.processingAt),
    shippedAt: parseDate(row.shippedAt),
    deliveredAt: parseDate(row.deliveredAt),
    cancelledAt: parseDate(row.cancelledAt),
    shippingServiceName:
      row.shippingServiceName != null ? String(row.shippingServiceName) : null,
    shippingAddress:
      row.shippingAddress != null && typeof row.shippingAddress === "object"
        ? (row.shippingAddress as Record<string, unknown>)
        : null,
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    items: items.map((i) => ({
      id: String(i.id),
      orderId: String(i.orderId),
      productId: i.productId != null ? String(i.productId) : "",
      variantId: i.variantId != null ? String(i.variantId) : null,
      name: String(i.name),
      sku: i.sku != null ? String(i.sku) : null,
      quantity: Number(i.quantity),
      priceCents: Number(i.priceCents),
      deductedStock: Boolean(i.deductedStock),
      createdAt: new Date(String(i.createdAt)),
      updatedAt: new Date(String(i.updatedAt)),
    })),
    payments: payments.map((p) => ({
      id: String(p.id),
      orderId: String(p.orderId),
      status: p.status as Payment["status"],
      method: p.method as Payment["method"],
      amountCents: Number(p.amountCents),
      mercadoPagoId: p.mercadoPagoId != null ? String(p.mercadoPagoId) : null,
      mercadoPagoPrefId: p.mercadoPagoPrefId != null ? String(p.mercadoPagoPrefId) : null,
      externalReference: p.externalReference != null ? String(p.externalReference) : null,
      metadata: p.metadata as Payment["metadata"],
      paidAt: p.paidAt ? new Date(String(p.paidAt)) : null,
      createdAt: new Date(String(p.createdAt)),
      updatedAt: new Date(String(p.updatedAt)),
    })),
    user: (row.User as Record<string, unknown>) ?? null,
  };
}

export async function getOrder(id: string) {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Order)
      .select("*, OrderItem(*), Payment(*), User(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normalizeOrder(data as Record<string, unknown>);
  });
}

export async function updateOrder(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = orderUpdateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const db = getDb();
    const { data: current, error: findErr } = await db
      .from(TABLES.Order)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (findErr || !current) return { success: false, error: "Pedido não encontrado" };

    const currentStatus = current.status as OrderStatus;
    const newStatus = parsed.data.status;
    const trackingCode = parsed.data.trackingCode?.trim() || null;
    const carrier =
      parsed.data.carrier?.trim() ||
      (newStatus === OrderStatus.SHIPPED ? "Correios" : null);

    const validationError = validateOrderStatusUpdate({
      currentStatus,
      nextStatus: newStatus,
      trackingCode,
      carrier,
    });
    if (validationError) {
      return { success: false, error: validationError };
    }

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      status: newStatus,
      trackingCode,
      carrier,
      updatedAt: now,
    };

    if (currentStatus !== newStatus) {
      const tsField = statusTimestampField(newStatus);
      if (tsField) patch[tsField] = now;
    }

    const { error } = await db.from(TABLES.Order).update(patch).eq("id", id);
    if (error) return { success: false, error: error.message };

    if (currentStatus !== newStatus) {
      if (newStatus === OrderStatus.PROCESSING) {
        await onOrderProcessing(id);
      } else if (newStatus === OrderStatus.SHIPPED) {
        await onOrderShipped(id);
      } else if (newStatus === OrderStatus.DELIVERED) {
        await onOrderDelivered(id);
      } else if (newStatus === OrderStatus.CANCELLED) {
        await onOrderCancelled(id);
      }
    } else if (trackingCode && trackingCode !== current.trackingCode) {
      const trackingUrl =
        buildTrackingUrl(
          carrier ?? (current.carrier != null ? String(current.carrier) : null),
          trackingCode,
        ) ?? undefined;
      await onTrackingUpdate(id, trackingCode, trackingUrl);
    }

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "Order",
      entityId: id,
      metadata: parsed.data,
    });

    revalidateAdmin(["/admin/pedidos", `/admin/pedidos/${id}`]);
    revalidatePath("/conta/pedidos");
    revalidatePath(`/conta/pedidos/${id}`);

    return { success: true };
  });
}
