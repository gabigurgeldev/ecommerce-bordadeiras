"use server";

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

    const withCounts = await Promise.all(
      (users ?? []).map(async (u) => {
        const { count } = await db
          .from(TABLES.Order)
          .select("*", { count: "exact", head: true })
          .eq("userId", u.id as string);
        return { ...u, _count: { orders: count ?? 0 } };
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
