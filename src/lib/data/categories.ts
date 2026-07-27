import { unstable_cache } from "next/cache";
import {
  CATALOG_REVALIDATE_SECONDS,
  CATALOG_TAGS,
} from "@/lib/data/cache-tags";
import { mapCategory, parseCategoryRow } from "@/lib/data/mappers";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { Category } from "@/lib/types/catalog";

/**
 * One query for every category count instead of a `count exact head` per
 * category (this ran three times per storefront request: layout, home, /loja).
 */
async function countProductsByCategory(): Promise<Map<string, number>> {
  const { data, error } = await getDb()
    .from(TABLES.Product)
    .select("categoryId")
    .eq("active", true);
  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const row of data) {
    const id = row.categoryId != null ? String(row.categoryId) : null;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await getDb()
      .from(TABLES.Category)
      .select("*")
      .eq("active", true)
      .order("sortOrder", { ascending: true });
    if (error || !data?.length) return [];

    const counts = await countProductsByCategory();
    return data.map((row) =>
      mapCategory(
        parseCategoryRow(
          row as Record<string, unknown>,
          counts.get(String(row.id)) ?? 0,
        ),
      ),
    );
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  const cached = unstable_cache(fetchCategories, ["categories"], {
    tags: [CATALOG_TAGS.categories],
    revalidate: CATALOG_REVALIDATE_SECONDS,
  });
  return cached();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}
