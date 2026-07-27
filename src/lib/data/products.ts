import { unstable_cache } from "next/cache";
import { mapProduct, parseProductRow } from "@/lib/data/mappers";
import {
  CATALOG_REVALIDATE_SECONDS,
  CATALOG_TAGS,
} from "@/lib/data/cache-tags";
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
    // Category is filtered through an inner join so PostgREST drops the
    // non-matching parents instead of us pulling the whole catalog and
    // filtering it in JS.
    const select = filters.categorySlug
      ? PRODUCT_LIST_SELECT.replace("Category(*)", "Category!inner(*)")
      : PRODUCT_LIST_SELECT;

    let query = db
      .from(TABLES.Product)
      .select(select)
      .eq("active", true)
      .eq("status", "ACTIVE");

    if (filters.categorySlug) {
      query = query.eq("Category.slug", filters.categorySlug);
    }
    if (filters.inStock) {
      query = query.or("stockUnlimited.eq.true,stock.gt.0");
    }
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

    if (filters.limit != null) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[getProducts]", error.message);
      }
      return [];
    }
    if (!data?.length) return [];

    let rows = data.map((r) =>
      parseProductRow(r as unknown as Record<string, unknown>),
    );

    // Free-text search still runs in JS: tags is a TEXT[] and the current
    // behaviour is substring matching, which PostgREST can't express directly.
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

    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  const cached = unstable_cache(
    () => fromDb(filters),
    ["products", JSON.stringify(filters)],
    { tags: [CATALOG_TAGS.products], revalidate: CATALOG_REVALIDATE_SECONDS },
  );
  return cached();
}

/**
 * Header mega-menu previews. Used to run one full-catalog query per category on
 * every storefront request; now a single query grouped in JS.
 */
export async function getCategoryPreviews(
  categoryIds: string[],
  perCategory = 5,
): Promise<Map<string, Product[]>> {
  if (categoryIds.length === 0) return new Map();

  const cached = unstable_cache(
    async () => {
      try {
        const { data, error } = await getDb()
          .from(TABLES.Product)
          .select(PRODUCT_LIST_SELECT)
          .eq("active", true)
          .eq("status", "ACTIVE")
          .in("categoryId", categoryIds)
          .order("createdAt", { ascending: false });
        if (error || !data?.length) return [];
        return data.map((r) =>
          mapProduct(parseProductRow(r as Record<string, unknown>)),
        );
      } catch {
        return [];
      }
    },
    ["category-previews", categoryIds.join(","), String(perCategory)],
    { tags: [CATALOG_TAGS.products], revalidate: CATALOG_REVALIDATE_SECONDS },
  );

  const products = await cached();
  const byCategory = new Map<string, Product[]>();
  for (const product of products) {
    const bucket = byCategory.get(product.categoryId);
    if (!bucket) byCategory.set(product.categoryId, [product]);
    else if (bucket.length < perCategory) bucket.push(product);
  }
  return byCategory;
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const cached = unstable_cache(
    async () => {
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
    },
    ["featured-products", String(limit)],
    { tags: [CATALOG_TAGS.products], revalidate: CATALOG_REVALIDATE_SECONDS },
  );
  return cached();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const cached = unstable_cache(
    async () => {
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
    },
    ["product", slug],
    { tags: [CATALOG_TAGS.products], revalidate: CATALOG_REVALIDATE_SECONDS },
  );
  return cached();
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const related = await getProducts({
    categorySlug: product.categorySlug,
    limit: limit + 1,
  });
  return related.filter((p) => p.id !== product.id).slice(0, limit);
}
