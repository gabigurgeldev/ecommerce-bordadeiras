import { getDb, newId, TABLES } from "@/lib/supabase/db";
import type { JsonValue } from "@/lib/types/database";

export type CreateOrderInput = {
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string | null;
  shippingAddress?: JsonValue;
  shippingAddressId?: string | null;
  couponId?: string | null;
  subtotalCents: number;
  discountCents?: number;
  shippingCents: number;
  shippingServiceId?: string | null;
  shippingServiceName?: string | null;
  totalCents: number;
  status?: string;
  items: {
    productId?: string | null;
    variantId?: string | null;
    name: string;
    sku?: string | null;
    quantity: number;
    priceCents: number;
  }[];
};

export async function createOrderWithItems(input: CreateOrderInput) {
  const db = getDb();
  const orderId = newId();
  const now = new Date().toISOString();

  const { error: orderError } = await db.from(TABLES.Order).insert({
    id: orderId,
    orderNumber: input.orderNumber,
    userId: input.userId ?? null,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone ?? null,
    shippingAddress: input.shippingAddress ?? null,
    shippingAddressId: input.shippingAddressId ?? null,
    couponId: input.couponId ?? null,
    subtotalCents: input.subtotalCents,
    discountCents: input.discountCents ?? 0,
    shippingCents: input.shippingCents,
    shippingServiceId: input.shippingServiceId ?? null,
    shippingServiceName: input.shippingServiceName ?? null,
    totalCents: input.totalCents,
    status: input.status ?? "PENDING",
    createdAt: now,
    updatedAt: now,
  });
  if (orderError) throw orderError;

  const itemRows = input.items.map((item) => ({
    id: newId(),
    orderId,
    productId: item.productId ?? null,
    variantId: item.variantId ?? null,
    name: item.name,
    sku: item.sku ?? null,
    quantity: item.quantity,
    priceCents: item.priceCents,
  }));

  const { error: itemsError } = await db.from(TABLES.OrderItem).insert(itemRows);
  if (itemsError) throw itemsError;

  const { data: order } = await db
    .from(TABLES.Order)
    .select("*, OrderItem(*)")
    .eq("id", orderId)
    .single();

  return order;
}
