import {
  createOrderWithItems,
  type CreateOrderInput,
} from "@/lib/data/order-create";
import { fetchOrderWithItems } from "@/lib/data/order-fetch";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { formatSupabaseError } from "@/lib/supabase/error-message";
import type { ShippingAddress } from "@/lib/types/catalog";
import { OrderStatus } from "@/lib/types/database";

export type PendingCheckoutResume = {
  orderId: string;
  createdAt: Date;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingServiceName: string | null;
  couponCode: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: ShippingAddress;
  shippingAddressId: string | null;
  items: { name: string; quantity: number; priceCents: number }[];
};

function parseShippingAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const cep = String(a.cep ?? a.zipCode ?? "").replace(/\D/g, "");
  const street = String(a.street ?? "").trim();
  const number = String(a.number ?? "").trim();
  const neighborhood = String(a.neighborhood ?? "").trim();
  const city = String(a.city ?? "").trim();
  const state = String(a.state ?? "").trim();
  if (cep.length < 8 || !street || !number || !neighborhood || !city || state.length !== 2) {
    return null;
  }
  return {
    cep,
    street,
    number,
    complement: a.complement ? String(a.complement) : undefined,
    neighborhood,
    city,
    state: state.toUpperCase(),
  };
}

async function buildPendingCheckoutResume(
  order: Record<string, unknown>,
  items: { name: unknown; quantity: unknown; priceCents: unknown }[],
  couponCode: string | null,
): Promise<PendingCheckoutResume | null> {
  const shippingAddress = parseShippingAddress(order.shippingAddress);
  if (!shippingAddress) return null;

  return {
    orderId: String(order.id),
    createdAt: new Date(String(order.createdAt)),
    totalCents: Number(order.totalCents),
    subtotalCents: Number(order.subtotalCents ?? order.totalCents),
    discountCents: Number(order.discountCents ?? 0),
    shippingCents: Number(order.shippingCents ?? 0),
    shippingServiceName:
      order.shippingServiceName != null ? String(order.shippingServiceName) : null,
    couponCode,
    customerName: String(order.customerName),
    customerEmail: String(order.customerEmail),
    customerPhone:
      order.customerPhone != null ? String(order.customerPhone) : null,
    shippingAddress,
    shippingAddressId:
      order.shippingAddressId != null ? String(order.shippingAddressId) : null,
    items: items.map((item) => ({
      name: String(item.name),
      quantity: Number(item.quantity),
      priceCents: Number(item.priceCents),
    })),
  };
}

export async function getPendingCheckoutOrderForUser(
  userId: string,
  orderId?: string,
): Promise<PendingCheckoutResume | null> {
  try {
    const db = getDb();
    let query = db
      .from(TABLES.Order)
      .select(
        "id, status, totalCents, subtotalCents, discountCents, shippingCents, shippingServiceName, customerName, customerEmail, customerPhone, shippingAddress, shippingAddressId, couponId, createdAt",
      )
      .eq("userId", userId)
      .eq("status", OrderStatus.PENDING);

    if (orderId) {
      query = query.eq("id", orderId);
    } else {
      query = query.order("createdAt", { ascending: false }).limit(1);
    }

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) return null;

    const { data: items } = await db
      .from(TABLES.OrderItem)
      .select("name, quantity, priceCents")
      .eq("orderId", order.id as string);

    if (!items?.length) return null;

    let couponCode: string | null = null;
    if (order.couponId) {
      const { data: coupon } = await db
        .from(TABLES.Coupon)
        .select("code")
        .eq("id", order.couponId as string)
        .maybeSingle();
      couponCode = coupon?.code ? String(coupon.code) : null;
    }

    return buildPendingCheckoutResume(
      order as Record<string, unknown>,
      items,
      couponCode,
    );
  } catch {
    return null;
  }
}

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

  if (updateError) throw new Error(formatSupabaseError(updateError));

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
  if (itemsError) throw new Error(formatSupabaseError(itemsError));

  const order = await fetchOrderWithItems(orderId);

  return { order, reused: true, previousCouponId };
}
