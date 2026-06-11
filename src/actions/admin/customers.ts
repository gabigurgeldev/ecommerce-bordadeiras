"use server";

import {
  getAdminCustomerInsights,
  getCustomerListSignals,
} from "@/lib/data/admin-customer-insights";
import { getDb, TABLES } from "@/lib/supabase/db";
import { Role } from "@/lib/types/database";
import { withAdminRead } from "./_utils";

export async function listCustomers() {
  return withAdminRead(async () => {
    const db = getDb();
    const { data: users, error } = await db
      .from(TABLES.User)
      .select("*")
      .eq("role", Role.USER)
      .order("createdAt", { ascending: false });
    if (error) throw error;

    const userList = users ?? [];
    const userIds = userList.map((u) => String(u.id));
    const signals = await getCustomerListSignals(userIds);

    const withCounts = await Promise.all(
      userList.map(async (u) => {
        const id = u.id as string;
        const { count } = await db
          .from(TABLES.Order)
          .select("*", { count: "exact", head: true })
          .eq("userId", id);
        const sig = signals.get(id);
        return {
          ...u,
          _count: { orders: count ?? 0 },
          _signals: sig ?? { hasPendingPayment: false, hasActiveCart: false },
        };
      }),
    );
    return withCounts;
  });
}

export async function getCustomer(id: string) {
  return withAdminRead(async () => {
    const db = getDb();
    const { data: user, error } = await db
      .from(TABLES.User)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!user) return null;

    const { data: orders } = await db
      .from(TABLES.Order)
      .select("*, OrderItem(*)")
      .eq("userId", id)
      .order("createdAt", { ascending: false });

    return {
      ...user,
      createdAt: new Date(String(user.createdAt)),
      orders: (orders ?? []).map((o) => ({
        ...o,
        id: String(o.id),
        totalCents: Number(o.totalCents),
        status: String(o.status),
        createdAt: new Date(String(o.createdAt)),
      })),
    };
  });
}

export async function getCustomerInsights(id: string) {
  return withAdminRead(async () => {
    const insights = await getAdminCustomerInsights(id);
    if (!insights) return null;
    const db = getDb();
    const { data: session } = await db
      .from(TABLES.WhatsappSession)
      .select("status")
      .eq("sessionId", "default")
      .maybeSingle();
    return {
      ...insights,
      whatsappConnected: session?.status === "connected",
    };
  });
}
