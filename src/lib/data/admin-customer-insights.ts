import {
  getActivitiesForUser,
  getRecentProductViews,
  type CustomerActivityRow,
} from "@/lib/data/customer-activity";
import { getServerCart } from "@/lib/data/cart";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { Address } from "@/lib/types/database";
import { OrderStatus } from "@/lib/types/database";

export type CustomerOpportunityType = "pending_payment" | "abandoned_cart" | "none";

export type PendingPaymentOrder = {
  id: string;
  totalCents: number;
  createdAt: Date;
  items: { name: string; quantity: number; priceCents: number }[];
};

export type CartLineInsight = {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  slug: string;
};

export type TopProductInsight = {
  productId: string | null;
  name: string;
  totalQuantity: number;
  source: "purchased" | "cart";
};

export type CustomerReviewInsight = {
  id: string;
  productName: string;
  rating: number;
  text: string;
  createdAt: Date;
};

export type CustomerOrderInsight = {
  id: string;
  totalCents: number;
  status: string;
  createdAt: Date;
  itemCount: number;
};

export type AdminCustomerInsights = {
  profile: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    createdAt: Date;
    addresses: Address[];
  };
  stats: {
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    lifetimeRevenueCents: number;
    avgOrderCents: number;
    lastOrderAt: Date | null;
    daysSinceLastOrder: number | null;
  };
  opportunities: {
    pendingPaymentOrders: PendingPaymentOrder[];
    activeCart: CartLineInsight[];
    cartSubtotalCents: number;
    primaryOpportunity: CustomerOpportunityType;
  };
  interests: {
    topProducts: TopProductInsight[];
    recentProductViews: { productId: string; productName: string; viewedAt: Date }[];
  };
  activity: CustomerActivityRow[];
  reviews: CustomerReviewInsight[];
  orders: CustomerOrderInsight[];
  resolvedPhone: string | null;
};

function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    userId: String(row.userId),
    label: row.label != null ? String(row.label) : null,
    recipientName: String(row.recipientName),
    phone: row.phone != null ? String(row.phone) : null,
    zipCode: String(row.zipCode),
    street: String(row.street),
    number: String(row.number),
    complement: row.complement != null ? String(row.complement) : null,
    neighborhood: String(row.neighborhood),
    city: String(row.city),
    state: String(row.state),
    country: String(row.country ?? "BR"),
    isDefault: Boolean(row.isDefault),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
  };
}

const PAID_STATUSES = new Set<string>([
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]);

export async function getAdminCustomerInsights(
  userId: string,
): Promise<AdminCustomerInsights | null> {
  const db = getDb();

  const { data: user, error: userError } = await db
    .from(TABLES.User)
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (userError || !user) return null;

  const [
    addressesRes,
    ordersRes,
    cartLines,
    activity,
    recentViews,
    reviewsRes,
  ] = await Promise.all([
    db
      .from(TABLES.Address)
      .select("*")
      .eq("userId", userId)
      .order("isDefault", { ascending: false }),
    db
      .from(TABLES.Order)
      .select("*, OrderItem(*)")
      .eq("userId", userId)
      .order("createdAt", { ascending: false }),
    getServerCart(userId),
    getActivitiesForUser(userId, 50),
    getRecentProductViews(userId, 8),
    db
      .from(TABLES.ProductReview)
      .select("id, rating, text, createdAt, productId")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(10),
  ]);

  const orders = (ordersRes.data ?? []) as Record<string, unknown>[];
  const addresses = (addressesRes.data ?? []).map((a) =>
    mapAddress(a as Record<string, unknown>),
  );

  let paidOrders = 0;
  let pendingOrders = 0;
  let cancelledOrders = 0;
  let lifetimeRevenueCents = 0;
  let lastOrderAt: Date | null = null;

  const pendingPaymentOrders: PendingPaymentOrder[] = [];
  const orderInsights: CustomerOrderInsight[] = [];
  const purchasedCounts = new Map<string, { name: string; qty: number }>();

  for (const o of orders) {
    const status = String(o.status);
    const createdAt = new Date(String(o.createdAt));
    const totalCents = Number(o.totalCents);
    const items = (o.OrderItem as Record<string, unknown>[] | null) ?? [];

    if (!lastOrderAt || createdAt > lastOrderAt) lastOrderAt = createdAt;

    if (status === OrderStatus.PENDING) {
      pendingOrders++;
      pendingPaymentOrders.push({
        id: String(o.id),
        totalCents,
        createdAt,
        items: items.map((item) => ({
          name: String(item.name),
          quantity: Number(item.quantity),
          priceCents: Number(item.priceCents),
        })),
      });
    } else if (status === OrderStatus.CANCELLED) {
      cancelledOrders++;
    } else if (PAID_STATUSES.has(status)) {
      paidOrders++;
      lifetimeRevenueCents += totalCents;
    }

    for (const item of items) {
      const pid = item.productId ? String(item.productId) : `order-${item.id}`;
      const name = String(item.name);
      const qty = Number(item.quantity);
      if (PAID_STATUSES.has(status) || status === OrderStatus.PENDING) {
        const prev = purchasedCounts.get(pid);
        purchasedCounts.set(pid, {
          name,
          qty: (prev?.qty ?? 0) + qty,
        });
      }
    }

    orderInsights.push({
      id: String(o.id),
      totalCents,
      status,
      createdAt,
      itemCount: items.length,
    });
  }

  const totalOrders = orders.length;
  const avgOrderCents =
    paidOrders > 0 ? Math.round(lifetimeRevenueCents / paidOrders) : 0;
  const daysSinceLastOrder = lastOrderAt
    ? Math.floor((Date.now() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const activeCart: CartLineInsight[] = cartLines.map((l) => ({
    productId: l.productId,
    name: l.name,
    quantity: l.quantity,
    priceCents: l.priceCents,
    slug: l.slug,
  }));
  const cartSubtotalCents = cartLines.reduce(
    (s, l) => s + l.priceCents * l.quantity,
    0,
  );

  let primaryOpportunity: CustomerOpportunityType = "none";
  if (pendingPaymentOrders.length > 0) {
    primaryOpportunity = "pending_payment";
  } else if (activeCart.length > 0) {
    primaryOpportunity = "abandoned_cart";
  }

  const topProducts: TopProductInsight[] = [];
  for (const [productId, data] of purchasedCounts) {
    topProducts.push({
      productId: productId.startsWith("order-") ? null : productId,
      name: data.name,
      totalQuantity: data.qty,
      source: "purchased",
    });
  }
  for (const line of activeCart) {
    const existing = topProducts.find(
      (p) => p.productId === line.productId && p.source === "cart",
    );
    if (existing) {
      existing.totalQuantity += line.quantity;
    } else {
      topProducts.push({
        productId: line.productId,
        name: line.name,
        totalQuantity: line.quantity,
        source: "cart",
      });
    }
  }
  topProducts.sort((a, b) => b.totalQuantity - a.totalQuantity);

  const reviewRows = (reviewsRes.data ?? []) as Record<string, unknown>[];
  const productIds = [
    ...new Set(
      reviewRows
        .map((r) => (r.productId ? String(r.productId) : null))
        .filter(Boolean) as string[],
    ),
  ];
  const productNameMap = new Map<string, string>();
  if (productIds.length > 0) {
    const { data: products } = await db
      .from(TABLES.Product)
      .select("id, name")
      .in("id", productIds);
    for (const p of products ?? []) {
      productNameMap.set(String(p.id), String(p.name));
    }
  }

  const reviews: CustomerReviewInsight[] = reviewRows.map((r) => ({
    id: String(r.id),
    productName:
      productNameMap.get(String(r.productId)) ?? "Produto",
    rating: Number(r.rating),
    text: String(r.text ?? ""),
    createdAt: new Date(String(r.createdAt)),
  }));

  let resolvedPhone = user.phone ? String(user.phone) : null;
  if (!resolvedPhone) {
    for (const o of orders) {
      if (o.customerPhone) {
        resolvedPhone = String(o.customerPhone);
        break;
      }
    }
  }
  if (!resolvedPhone && addresses.length > 0) {
    const addrPhone = addresses.find((a) => a.phone)?.phone;
    if (addrPhone) resolvedPhone = addrPhone;
  }

  return {
    profile: {
      id: userId,
      name: user.name != null ? String(user.name) : null,
      email: String(user.email),
      phone: user.phone != null ? String(user.phone) : null,
      createdAt: new Date(String(user.createdAt)),
      addresses,
    },
    stats: {
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      lifetimeRevenueCents,
      avgOrderCents,
      lastOrderAt,
      daysSinceLastOrder,
    },
    opportunities: {
      pendingPaymentOrders,
      activeCart,
      cartSubtotalCents,
      primaryOpportunity,
    },
    interests: {
      topProducts: topProducts.slice(0, 10),
      recentProductViews: recentViews,
    },
    activity,
    reviews,
    orders: orderInsights,
    resolvedPhone,
  };
}

export type CustomerListSignals = {
  hasPendingPayment: boolean;
  hasActiveCart: boolean;
};

export async function getCustomerListSignals(
  userIds: string[],
): Promise<Map<string, CustomerListSignals>> {
  const map = new Map<string, CustomerListSignals>();
  if (userIds.length === 0) return map;

  for (const id of userIds) {
    map.set(id, { hasPendingPayment: false, hasActiveCart: false });
  }

  const db = getDb();
  const { data: pending } = await db
    .from(TABLES.Order)
    .select("userId")
    .in("userId", userIds)
    .eq("status", OrderStatus.PENDING);

  for (const row of pending ?? []) {
    const uid = String(row.userId);
    const cur = map.get(uid);
    if (cur) cur.hasPendingPayment = true;
  }

  const { data: carts } = await db
    .from(TABLES.CartItem)
    .select("userId")
    .in("userId", userIds);

  const cartUsers = new Set((carts ?? []).map((r) => String(r.userId)));
  for (const uid of cartUsers) {
    const cur = map.get(uid);
    if (cur) cur.hasActiveCart = true;
  }

  return map;
}
