import {
  createOrderWithItems,
  type CreateOrderInput,
} from "@/lib/data/order-create";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { OrderStatus } from "@/lib/types/database";

export async function upsertPendingCheckoutOrder(
  userId: string,
  input: CreateOrderInput,
): Promise<{
  order: Awaited<ReturnType<typeof createOrderWithItems>>;
  reused: boolean;
  previousCouponId: string | null;
}> {
  const db = getDb();
  const now = new Date().toISOString();

  const { data: existing } = await db
    .from(TABLES.Order)
    .select("id, couponId")
    .eq("userId", userId)
    .eq("status", OrderStatus.PENDING)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const order = await createOrderWithItems({
      ...input,
      userId,
      status: OrderStatus.PENDING,
    });
    return { order, reused: false, previousCouponId: null };
  }

  const orderId = String(existing.id);
  const previousCouponId = existing.couponId ? String(existing.couponId) : null;

  const { error: updateError } = await db
    .from(TABLES.Order)
    .update({
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
      updatedAt: now,
    })
    .eq("id", orderId);

  if (updateError) throw updateError;

  await db.from(TABLES.OrderItem).delete().eq("orderId", orderId);

  const rows = input.items.map((item) => ({
    id: newId(),
    orderId,
    productId: item.productId ?? null,
    variantId: item.variantId ?? null,
    name: item.name,
    sku: item.sku ?? null,
    quantity: item.quantity,
    priceCents: item.priceCents,
  }));

  const { error: itemsError } = await db.from(TABLES.OrderItem).insert(rows);
  if (itemsError) throw itemsError;

  const { data: order, error: fetchError } = await db
    .from(TABLES.Order)
    .select("*, OrderItem(*)")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    throw fetchError ?? new Error("Order not found after update");
  }

  return { order, reused: true, previousCouponId };
}
