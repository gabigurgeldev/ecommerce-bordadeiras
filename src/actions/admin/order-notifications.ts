"use server";

import { getDb, TABLES } from "@/lib/supabase/db";
import { withAdminRead } from "./_utils";

export type AdminOrderNotificationItem = {
  id: string;
  customerName: string;
  totalCents: number;
  status: string;
  paidAt: string;
};

export type AdminOrderNotificationsResult = {
  unreadCount: number;
  recent: AdminOrderNotificationItem[];
};

export async function fetchAdminOrderNotifications(
  sinceIso?: string,
): Promise<AdminOrderNotificationsResult> {
  return withAdminRead(async () => {
    const db = getDb();
    const since = sinceIso ?? new Date(0).toISOString();

    const [countResult, listResult] = await Promise.all([
      db
        .from(TABLES.Order)
        .select("id", { count: "exact", head: true })
        .not("paidAt", "is", null)
        .gt("paidAt", since),
      db
        .from(TABLES.Order)
        .select("id, customerName, totalCents, status, paidAt")
        .not("paidAt", "is", null)
        .order("paidAt", { ascending: false })
        .limit(15),
    ]);

    if (countResult.error) throw countResult.error;
    if (listResult.error) throw listResult.error;

    const recent = (listResult.data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: String(r.id),
        customerName: String(r.customerName ?? ""),
        totalCents: Number(r.totalCents),
        status: String(r.status),
        paidAt: String(r.paidAt),
      };
    });

    return {
      unreadCount: countResult.count ?? 0,
      recent,
    };
  });
}
