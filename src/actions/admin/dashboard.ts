"use server";

import { OrderStatus, PaymentStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { withAdminRead } from "./_utils";

export async function getDashboardStats() {
  return withAdminRead(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      paidOrders,
      orderCount,
      productCount,
      customerCount,
      recentOrders,
      allOrdersLast30,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: PaymentStatus.APPROVED },
        _sum: { amountCents: true },
      }),
      prisma.order.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.order.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, totalCents: true, status: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo }, status: { not: OrderStatus.CANCELLED } },
      }),
    ]);

    const paidCount = recentOrders.filter((o) => o.status === OrderStatus.PAID || o.status === OrderStatus.DELIVERED).length;
    const conversion = allOrdersLast30 > 0 ? (paidCount / allOrdersLast30) * 100 : 0;

    const revenueByDay = new Map<string, number>();
    for (const o of recentOrders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + o.totalCents);
    }

    const chartData = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({
      date,
      revenue: revenue / 100,
    }));

    return {
      revenueCents: paidOrders._sum.amountCents ?? 0,
      orderCount,
      productCount,
      customerCount,
      conversionRate: conversion,
      chartData,
    };
  });
}

export async function listAuditLogs(limit = 100) {
  return withAdminRead(() =>
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  );
}
