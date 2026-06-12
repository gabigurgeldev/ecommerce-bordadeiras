import { getDb, TABLES } from "@/lib/supabase/db";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types/database";

export type OrderPaymentSummary = {
  method: PaymentMethod | null;
  status: PaymentStatus;
  amountCents: number;
  paidAt: Date | null;
};

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
  itemCount: number;
  trackingCode: string | null;
  carrier: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  shippingServiceName: string | null;
};

export type OrderDetailItem = {
  id: string;
  name: string;
  quantity: number;
  priceCents: number;
  productId: string | null;
  productSlug: string | null;
  imageUrl: string | null;
};

export type OrderDetail = OrderSummary & {
  shippingCents: number;
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  customerName: string;
  customerEmail: string;
  shippingAddress: Record<string, unknown> | null;
  paidAt: Date | null;
  processingAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  payments: OrderPaymentSummary[];
  items: OrderDetailItem[];
};

function parseDate(value: unknown): Date | null {
  if (value == null) return null;
  return new Date(String(value));
}

async function fetchLatestPaymentsByOrderIds(
  orderIds: string[],
): Promise<Map<string, OrderPaymentSummary>> {
  const map = new Map<string, OrderPaymentSummary>();
  if (orderIds.length === 0) return map;

  const db = getDb();
  const { data: payments } = await db
    .from(TABLES.Payment)
    .select("orderId, method, status, amountCents, paidAt, createdAt")
    .in("orderId", orderIds)
    .order("createdAt", { ascending: false });

  for (const payment of payments ?? []) {
    const orderId = String(payment.orderId);
    if (map.has(orderId)) continue;
    map.set(orderId, {
      method: payment.method != null ? (payment.method as PaymentMethod) : null,
      status: payment.status as PaymentStatus,
      amountCents: Number(payment.amountCents),
      paidAt: parseDate(payment.paidAt),
    });
  }

  return map;
}

export async function getOrdersForUser(userId: string): Promise<OrderSummary[]> {
  try {
    const db = getDb();
    const { data: orders, error } = await db
      .from(TABLES.Order)
      .select(
        "id, orderNumber, status, totalCents, createdAt, trackingCode, carrier, shippingServiceName",
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false });
    if (error || !orders) return [];

    const orderIds = orders.map((o) => String(o.id));
    const paymentsMap = await fetchLatestPaymentsByOrderIds(orderIds);

    const summaries = await Promise.all(
      orders.map(async (o) => {
        const orderId = String(o.id);
        const { count } = await db
          .from(TABLES.OrderItem)
          .select("*", { count: "exact", head: true })
          .eq("orderId", orderId);
        const payment = paymentsMap.get(orderId);

        return {
          id: orderId,
          orderNumber: String(o.orderNumber),
          status: o.status as OrderStatus,
          totalCents: Number(o.totalCents),
          createdAt: new Date(String(o.createdAt)),
          itemCount: count ?? 0,
          trackingCode: o.trackingCode != null ? String(o.trackingCode) : null,
          carrier: o.carrier != null ? String(o.carrier) : null,
          paymentMethod: payment?.method ?? null,
          paymentStatus: payment?.status ?? null,
          shippingServiceName:
            o.shippingServiceName != null
              ? String(o.shippingServiceName)
              : null,
        };
      }),
    );
    return summaries;
  } catch {
    return [];
  }
}

export async function getOrderForUser(
  userId: string,
  orderId: string,
): Promise<OrderDetail | null> {
  try {
    const db = getDb();
    const { data: order, error } = await db
      .from(TABLES.Order)
      .select(
        "id, orderNumber, status, totalCents, subtotalCents, shippingCents, discountCents, couponId, createdAt, trackingCode, carrier, shippingServiceName, customerName, customerEmail, shippingAddress, paidAt, processingAt, shippedAt, deliveredAt, cancelledAt",
      )
      .eq("id", orderId)
      .eq("userId", userId)
      .maybeSingle();
    if (error || !order) return null;

    const { data: items } = await db
      .from(TABLES.OrderItem)
      .select("id, name, quantity, priceCents, productId")
      .eq("orderId", orderId);

    const { data: payments } = await db
      .from(TABLES.Payment)
      .select("method, status, amountCents, paidAt")
      .eq("orderId", orderId)
      .order("createdAt", { ascending: false });

    let couponCode: string | null = null;
    if (order.couponId) {
      const { data: coupon } = await db
        .from(TABLES.Coupon)
        .select("code")
        .eq("id", String(order.couponId))
        .maybeSingle();
      couponCode = coupon?.code != null ? String(coupon.code) : null;
    }

    const productIds = [
      ...new Set(
        (items ?? [])
          .map((i) => (i.productId != null ? String(i.productId) : null))
          .filter((id): id is string => id != null),
      ),
    ];

    const productMap = new Map<
      string,
      { slug: string | null; imageUrl: string | null }
    >();

    if (productIds.length > 0) {
      const { data: products } = await db
        .from(TABLES.Product)
        .select("id, slug, imageUrl")
        .in("id", productIds);

      for (const product of products ?? []) {
        productMap.set(String(product.id), {
          slug: product.slug != null ? String(product.slug) : null,
          imageUrl: product.imageUrl != null ? String(product.imageUrl) : null,
        });
      }
    }

    const paymentsMap = await fetchLatestPaymentsByOrderIds([orderId]);
    const latestPayment = paymentsMap.get(orderId);

    return {
      id: String(order.id),
      orderNumber: String(order.orderNumber),
      status: order.status as OrderStatus,
      totalCents: Number(order.totalCents),
      subtotalCents: Number(order.subtotalCents ?? order.totalCents),
      shippingCents: Number(order.shippingCents),
      discountCents: Number(order.discountCents ?? 0),
      couponCode,
      createdAt: new Date(String(order.createdAt)),
      itemCount: items?.length ?? 0,
      trackingCode: order.trackingCode != null ? String(order.trackingCode) : null,
      carrier: order.carrier != null ? String(order.carrier) : null,
      paymentMethod: latestPayment?.method ?? null,
      paymentStatus: latestPayment?.status ?? null,
      shippingServiceName:
        order.shippingServiceName != null
          ? String(order.shippingServiceName)
          : null,
      paidAt: parseDate(order.paidAt),
      processingAt: parseDate(order.processingAt),
      shippedAt: parseDate(order.shippedAt),
      deliveredAt: parseDate(order.deliveredAt),
      cancelledAt: parseDate(order.cancelledAt),
      customerName: String(order.customerName),
      customerEmail: String(order.customerEmail),
      shippingAddress:
        order.shippingAddress != null &&
        typeof order.shippingAddress === "object"
          ? (order.shippingAddress as Record<string, unknown>)
          : null,
      payments: (payments ?? []).map((p) => ({
        method: p.method != null ? (p.method as PaymentMethod) : null,
        status: p.status as PaymentStatus,
        amountCents: Number(p.amountCents),
        paidAt: parseDate(p.paidAt),
      })),
      items: (items ?? []).map((i) => {
        const productId =
          i.productId != null ? String(i.productId) : null;
        const product = productId ? productMap.get(productId) : undefined;

        return {
          id: String(i.id),
          name: String(i.name),
          quantity: Number(i.quantity),
          priceCents: Number(i.priceCents),
          productId,
          productSlug: product?.slug ?? null,
          imageUrl: product?.imageUrl ?? null,
        };
      }),
    };
  } catch {
    return null;
  }
}
