"use server";

import { OrderStatus, PaymentStatus, Role } from "@/lib/types/database";
import { getDb, TABLES } from "@/lib/supabase/db";
import { withAdminRead } from "./_utils";

export async function getDashboardStats() {
  return withAdminRead(async () => {
    const db = getDb();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString();

    const [
      { data: payments },
      { count: orderCount },
      { count: productCount },
      { count: customerCount },
      { data: recentOrders },
      { data: ordersLast30 },
    ] = await Promise.all([
      db.from(TABLES.Payment).select("amountCents").eq("status", PaymentStatus.APPROVED),
      db.from(TABLES.Order).select("*", { count: "exact", head: true }),
      db.from(TABLES.Product).select("*", { count: "exact", head: true }).eq("active", true),
      db.from(TABLES.User).select("*", { count: "exact", head: true }).eq("role", Role.USER),
      db
        .from(TABLES.Order)
        .select("createdAt, totalCents, status")
        .gte("createdAt", since)
        .order("createdAt", { ascending: true }),
      db
        .from(TABLES.Order)
        .select("id, status")
        .gte("createdAt", since)
        .neq("status", OrderStatus.CANCELLED),
    ]);

    const revenueCents = (payments ?? []).reduce(
      (s, p) => s + Number(p.amountCents),
      0,
    );

    const recent = recentOrders ?? [];
    const allOrdersLast30 = ordersLast30?.length ?? 0;
    const paidCount = recent.filter(
      (o) => o.status === OrderStatus.PAID || o.status === OrderStatus.DELIVERED,
    ).length;
    const conversion = allOrdersLast30 > 0 ? (paidCount / allOrdersLast30) * 100 : 0;

    const revenueByDay = new Map<string, number>();
    for (const o of recent) {
      const key = String(o.createdAt).slice(0, 10);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(o.totalCents));
    }

    const chartData = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100,
    }));

    return {
      revenueCents,
      orderCount: orderCount ?? 0,
      productCount: productCount ?? 0,
      customerCount: customerCount ?? 0,
      conversionRate: conversion,
      chartData,
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
