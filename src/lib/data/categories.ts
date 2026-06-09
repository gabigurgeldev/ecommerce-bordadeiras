import { mapCategory, parseCategoryRow } from "@/lib/data/mappers";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { Category } from "@/lib/types/catalog";

export async function getCategories(): Promise<Category[]> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.Category)
      .select("*")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    if (error) return [];

    if (!data?.length) return [];

    const categories = await Promise.all(
      data.map(async (row) => {
        const { count } = await db
          .from(TABLES.Product)
          .select("*", { count: "exact", head: true })
          .eq("categoryId", row.id as string)
          .eq("active", true);
        return mapCategory(
          parseCategoryRow(row as Record<string, unknown>, count ?? 0),
        );
      }),
    );
    return categories;
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const db = getDb();
    const { data, error } = await db
      .from(TABLES.Category)
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (!error && data) {
      const { count } = await db
        .from(TABLES.Product)
        .select("*", { count: "exact", head: true })
        .eq("categoryId", data.id as string)
        .eq("active", true);
      return mapCategory(
        parseCategoryRow(data as Record<string, unknown>, count ?? 0),
      );
    }
  } catch {
    /* empty */
  }
  return null;
}
