import { getDb, newId, TABLES } from "@/lib/supabase/db";
import type { CustomerActivity, CustomerActivityType } from "@/lib/types/database";

export type RecordActivityInput = {
  userId: string;
  type: CustomerActivityType;
  path?: string | null;
  productId?: string | null;
  productName?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CustomerActivityRow = {
  id: string;
  type: CustomerActivityType;
  path: string | null;
  productId: string | null;
  productName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function mapRow(row: Record<string, unknown>): CustomerActivityRow {
  return {
    id: String(row.id),
    type: row.type as CustomerActivityType,
    path: row.path != null ? String(row.path) : null,
    productId: row.productId != null ? String(row.productId) : null,
    productName: row.productName != null ? String(row.productName) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : null,
    createdAt: new Date(String(row.createdAt)),
  };
}

export async function recordActivity(input: RecordActivityInput): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  await db.from(TABLES.CustomerActivity).insert({
    id: newId(),
    userId: input.userId,
    type: input.type,
    path: input.path ?? null,
    productId: input.productId ?? null,
    productName: input.productName ?? null,
    metadata: input.metadata ?? null,
    createdAt: now,
  });
}

export async function getActivitiesForUser(
  userId: string,
  limit = 50,
): Promise<CustomerActivityRow[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.CustomerActivity)
      .select("id, type, path, productId, productName, metadata, createdAt")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return data.map((row) => mapRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

export async function countRecentActivities(
  userId: string,
  sinceMs: number,
): Promise<number> {
  try {
    const db = getDb();
    const since = new Date(Date.now() - sinceMs).toISOString();
    const { count, error } = await db
      .from(TABLES.CustomerActivity)
      .select("*", { count: "exact", head: true })
      .eq("userId", userId)
      .gte("createdAt", since);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getRecentProductViews(
  userId: string,
  limit = 10,
): Promise<{ productId: string; productName: string; viewedAt: Date }[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.CustomerActivity)
      .select("productId, productName, createdAt")
      .eq("userId", userId)
      .eq("type", "PRODUCT_VIEW")
      .not("productId", "is", null)
      .order("createdAt", { ascending: false })
      .limit(limit * 3);
    if (error || !data) return [];

    const seen = new Set<string>();
    const result: { productId: string; productName: string; viewedAt: Date }[] =
      [];
    for (const row of data) {
      const pid = String(row.productId);
      if (seen.has(pid)) continue;
      seen.add(pid);
      result.push({
        productId: pid,
        productName: String(row.productName ?? "Produto"),
        viewedAt: new Date(String(row.createdAt)),
      });
      if (result.length >= limit) break;
    }
    return result;
  } catch {
    return [];
  }
}
