import { mapProduct, parseProductRow } from "@/lib/data/mappers";
import {
  isProductDetailSelectError,
  PRODUCT_DETAIL_SELECT,
  PRODUCT_LIST_SELECT,
} from "@/lib/data/product-select";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { Product, ProductFilters } from "@/lib/types/catalog";

async function fromDb(filters: ProductFilters): Promise<Product[]> {
  try {
    const db = getDb();
    let query = db
      .from(TABLES.Product)
      .select(PRODUCT_LIST_SELECT)
      .eq("active", true)
      .eq("status", "ACTIVE");

    if (filters.minPriceCents != null) {
      query = query.gte("priceCents", filters.minPriceCents);
    }
    if (filters.maxPriceCents != null) {
      query = query.lte("priceCents", filters.maxPriceCents);
    }

    const sortCol =
      filters.sort === "price-asc" || filters.sort === "price-desc"
        ? "priceCents"
        : filters.sort === "name"
          ? "name"
          : "createdAt";
    const ascending =
      filters.sort === "price-asc" || filters.sort === "name";
    query = query.order(sortCol, { ascending });

    const { data, error } = await query;
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getProducts]", error.message);
      }
      return [];
    }
    if (!data?.length) return [];

    let rows = data.map((r) => parseProductRow(r as Record<string, unknown>));

    if (filters.categorySlug) {
      rows = rows.filter((p) => p.category?.slug === filters.categorySlug);
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          (p.brand?.toLowerCase().includes(q) ?? false),
      );
    }

    if (filters.inStock) {
      rows = rows.filter((p) => p.stockUnlimited || p.stock > 0);
    }

    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  return fromDb(filters);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_LIST_SELECT)
      .eq("active", true)
      .eq("status", "ACTIVE")
      .order("createdAt", { ascending: false })
      .limit(limit);
    if (!error && data?.length) {
      return data.map((r) =>
        mapProduct(parseProductRow(r as Record<string, unknown>)),
      );
    }
  } catch {
    /* empty */
  }
  return [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    let { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_DETAIL_SELECT)
      .eq("slug", slug)
      .eq("active", true)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (error && isProductDetailSelectError(error)) {
      ({ data, error } = await getDb()
        .from(TABLES.Product)
        .select(PRODUCT_LIST_SELECT)
        .eq("slug", slug)
        .eq("active", true)
        .eq("status", "ACTIVE")
        .maybeSingle());
    }
    if (!error && data) {
      return mapProduct(parseProductRow(data as Record<string, unknown>));
    }
  } catch {
    /* empty */
  }
  return null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const all = await getProducts({ categorySlug: product.categorySlug });
  return all.filter((p) => p.id !== product.id).slice(0, limit);
}
