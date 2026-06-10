"use server";

import { OrderStatus, PaymentStatus, Role } from "@/lib/types/database";
import type { DashboardPeriod, DashboardStats } from "@/lib/types/admin-dashboard";
import {
  fillChartDays,
  getPeriodRange,
  startOfMonth,
  startOfToday,
} from "@/lib/admin-dashboard-period";
import { isPaidOrderStatus, PAID_ORDER_STATUSES } from "@/lib/order-status";
import { getDb, TABLES } from "@/lib/supabase/db";
import { withAdminRead } from "./_utils";

const LOW_STOCK_THRESHOLD = 5;

function sumAmount(rows: { amountCents: number }[] | null): number {
  return (rows ?? []).reduce((s, p) => s + Number(p.amountCents), 0);
}

/** Add revenue from paid orders that lack an approved Payment row (webhook lag). */
function addOrderRevenueFallback(
  paymentRevenue: number,
  orders: { id: string; totalCents: number; status: string }[] | null,
  approvedPaymentOrderIds: Set<string>,
): number {
  let extra = 0;
  for (const o of orders ?? []) {
    if (!isPaidOrderStatus(String(o.status))) continue;
    if (approvedPaymentOrderIds.has(String(o.id))) continue;
    extra += Number(o.totalCents);
  }
  return paymentRevenue + extra;
}

export async function getDashboardStats(period: DashboardPeriod = "30d"): Promise<DashboardStats> {
  return withAdminRead(async () => {
    const db = getDb();
    const { since, label: periodLabel } = getPeriodRange(period);
    const todaySince = startOfToday();
    const mtdSince = startOfMonth();

    const chartSince =
      since ??
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString();
      })();

    const [
      { data: allPayments, error: allPaymentsError },
      { data: periodPayments, error: periodPaymentsError },
      { data: todayPayments },
      { data: mtdPayments },
      { count: orderCount },
      { data: periodOrdersMeta },
      { count: ordersToday },
      { count: pendingOrders },
      { count: productCount },
      { count: inactiveProductCount },
      { data: lowStockProducts },
      { count: customerCount },
      { count: newCustomersPeriod },
      { count: activeCoupons },
      { data: recentOrdersRaw },
      { data: ordersForStatus },
      { data: recentAudit },
      { data: allPaidOrdersForFallback },
      { data: periodPaidOrdersForFallback },
    ] = await Promise.all([
      db.from(TABLES.Payment).select("amountCents, createdAt, orderId").eq("status", PaymentStatus.APPROVED),
      since
        ? db
            .from(TABLES.Payment)
            .select("amountCents, createdAt, orderId")
            .eq("status", PaymentStatus.APPROVED)
            .gte("createdAt", since)
        : db
            .from(TABLES.Payment)
            .select("amountCents, createdAt, orderId")
            .eq("status", PaymentStatus.APPROVED),
      db
        .from(TABLES.Payment)
        .select("amountCents")
        .eq("status", PaymentStatus.APPROVED)
        .gte("createdAt", todaySince),
      db
        .from(TABLES.Payment)
        .select("amountCents")
        .eq("status", PaymentStatus.APPROVED)
        .gte("createdAt", mtdSince),
      db.from(TABLES.Order).select("*", { count: "exact", head: true }),
      since
        ? db.from(TABLES.Order).select("id, status, totalCents, createdAt").gte("createdAt", since)
        : db.from(TABLES.Order).select("id, status, totalCents, createdAt"),
      db
        .from(TABLES.Order)
        .select("*", { count: "exact", head: true })
        .gte("createdAt", todaySince),
      db
        .from(TABLES.Order)
        .select("*", { count: "exact", head: true })
        .eq("status", OrderStatus.PENDING),
      db.from(TABLES.Product).select("*", { count: "exact", head: true }).eq("active", true),
      db.from(TABLES.Product).select("*", { count: "exact", head: true }).eq("active", false),
      db
        .from(TABLES.Product)
        .select("id")
        .eq("active", true)
        .lte("stock", LOW_STOCK_THRESHOLD),
      db.from(TABLES.User).select("*", { count: "exact", head: true }).eq("role", Role.USER),
      since
        ? db
            .from(TABLES.User)
            .select("*", { count: "exact", head: true })
            .eq("role", Role.USER)
            .gte("createdAt", since)
        : db
            .from(TABLES.User)
            .select("*", { count: "exact", head: true })
            .eq("role", Role.USER),
      db.from(TABLES.Coupon).select("*", { count: "exact", head: true }).eq("active", true),
      db
        .from(TABLES.Order)
        .select("id, totalCents, status, createdAt, userId")
        .order("createdAt", { ascending: false })
        .limit(8),
      db.from(TABLES.Order).select("status"),
      db
        .from(TABLES.AuditLog)
        .select("id, action, entity, entityId, userEmail, createdAt")
        .order("createdAt", { ascending: false })
        .limit(6),
      db
        .from(TABLES.Order)
        .select("id, totalCents, status")
        .in("status", [...PAID_ORDER_STATUSES]),
      since
        ? db
            .from(TABLES.Order)
            .select("id, totalCents, status")
            .in("status", [...PAID_ORDER_STATUSES])
            .gte("createdAt", since)
        : db
            .from(TABLES.Order)
            .select("id, totalCents, status")
            .in("status", [...PAID_ORDER_STATUSES]),
    ]);

    if (allPaymentsError) console.error("[dashboard] allPayments", allPaymentsError);
    if (periodPaymentsError) console.error("[dashboard] periodPayments", periodPaymentsError);

    const approvedOrderIds = new Set(
      (allPayments ?? []).map((p) => String(p.orderId)).filter(Boolean),
    );
    const approvedPeriodOrderIds = new Set(
      (periodPayments ?? []).map((p) => String(p.orderId)).filter(Boolean),
    );

    const revenueCents = addOrderRevenueFallback(
      sumAmount(allPayments),
      allPaidOrdersForFallback,
      approvedOrderIds,
    );
    const revenuePeriodCents = addOrderRevenueFallback(
      sumAmount(periodPayments),
      periodPaidOrdersForFallback,
      approvedPeriodOrderIds,
    );
    const revenueTodayCents = sumAmount(todayPayments);
    const revenueMtdCents = sumAmount(mtdPayments);

    const periodOrders = periodOrdersMeta ?? [];
    const orderCountPeriod = periodOrders.length;
    const paidInPeriod = periodOrders.filter((o) =>
      isPaidOrderStatus(String(o.status)),
    ).length;
    const nonCancelled = periodOrders.filter((o) => o.status !== OrderStatus.CANCELLED).length;
    const conversionRate = nonCancelled > 0 ? (paidInPeriod / nonCancelled) * 100 : 0;
    const aovCents = paidInPeriod > 0 ? Math.round(revenuePeriodCents / paidInPeriod) : 0;

    const { data: chartPayments } = await db
      .from(TABLES.Payment)
      .select("amountCents, createdAt")
      .eq("status", PaymentStatus.APPROVED)
      .gte("createdAt", chartSince);

    const revenueByDay = new Map<string, number>();
    for (const p of chartPayments ?? []) {
      const key = String(p.createdAt).slice(0, 10);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(p.amountCents));
    }
    const chartData = fillChartDays(chartSince, revenueByDay);

    const statusCounts = new Map<string, number>();
    for (const o of ordersForStatus ?? []) {
      statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
    }
    const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    const paidPeriodOrderIds = periodOrders
      .filter((o) => isPaidOrderStatus(String(o.status)))
      .map((o) => o.id as string);

    let topProducts: DashboardStats["topProducts"] = [];
    if (paidPeriodOrderIds.length > 0) {
      const { data: orderItems } = await db
        .from(TABLES.OrderItem)
        .select("productId, quantity, priceCents")
        .in("orderId", paidPeriodOrderIds.slice(0, 200));

      const productIds = [
        ...new Set((orderItems ?? []).map((row) => row.productId as string).filter(Boolean)),
      ];
      const productNames = new Map<string, string>();
      if (productIds.length > 0) {
        const { data: products } = await db
          .from(TABLES.Product)
          .select("id, name")
          .in("id", productIds);
        for (const p of products ?? []) {
          productNames.set(p.id as string, String(p.name ?? "Produto"));
        }
      }

      const productAgg = new Map<string, { name: string; quantity: number; revenueCents: number }>();
      for (const row of orderItems ?? []) {
        const pid = row.productId as string;
        const name = productNames.get(pid) ?? "Produto";
        const qty = Number(row.quantity);
        const rev = qty * Number(row.priceCents);
        const cur = productAgg.get(pid) ?? { name, quantity: 0, revenueCents: 0 };
        cur.quantity += qty;
        cur.revenueCents += rev;
        productAgg.set(pid, cur);
      }
      topProducts = Array.from(productAgg.entries())
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.revenueCents - a.revenueCents)
        .slice(0, 5);
    }

    const userIds = [
      ...new Set(
        (recentOrdersRaw ?? [])
          .map((o) => o.userId as string | null)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const userById = new Map<string, { name: string | null; email: string }>();
    if (userIds.length > 0) {
      const { data: users } = await db
        .from(TABLES.User)
        .select("id, name, email")
        .in("id", userIds);
      for (const u of users ?? []) {
        userById.set(u.id as string, {
          name: (u.name as string | null) ?? null,
          email: String(u.email),
        });
      }
    }

    const recentOrders = (recentOrdersRaw ?? []).map((o) => {
      const user = o.userId ? userById.get(o.userId as string) : undefined;
      return {
        id: o.id as string,
        totalCents: Number(o.totalCents),
        status: o.status as string,
        createdAt: String(o.createdAt),
        customerName: user?.name ?? null,
        customerEmail: user?.email ?? null,
      };
    });

    return {
      period,
      periodLabel,
      revenueCents,
      revenuePeriodCents,
      revenueTodayCents,
      revenueMtdCents,
      orderCount: orderCount ?? 0,
      orderCountPeriod,
      ordersToday: ordersToday ?? 0,
      pendingOrders: pendingOrders ?? 0,
      productCount: productCount ?? 0,
      inactiveProductCount: inactiveProductCount ?? 0,
      lowStockCount: lowStockProducts?.length ?? 0,
      customerCount: customerCount ?? 0,
      newCustomersPeriod: newCustomersPeriod ?? 0,
      activeCoupons: activeCoupons ?? 0,
      conversionRate,
      aovCents,
      chartData,
      recentOrders,
      ordersByStatus,
      topProducts,
      recentAudit: (recentAudit ?? []).map((a) => ({
        id: a.id as string,
        action: a.action as string,
        entity: a.entity as string,
        entityId: (a.entityId as string | null) ?? null,
        userEmail: (a.userEmail as string | null) ?? null,
        createdAt: String(a.createdAt),
      })),
    };
  });
}

export async function listAuditLogs(limit = 100) {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.AuditLog)
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  });
}
