import { isDatabaseAvailable } from "@/lib/data/db-available";
import { mapProduct, parseProductRow } from "@/lib/data/mappers";
import { mockProducts } from "@/lib/mock/catalog";
import { getDb, TABLES } from "@/lib/supabase/db";
import type { Product, ProductFilters } from "@/lib/types/catalog";

const PRODUCT_SELECT = "*, Category(*), ProductImage(*)";

async function fromDb(filters: ProductFilters): Promise<Product[]> {
  try {
    const db = getDb();
    let query = db
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
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
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }

    return rows.map(mapProduct);
  } catch {
    return [];
  }
}

function filterMockProducts(filters: ProductFilters): Product[] {
  let items = [...mockProducts];
  if (filters.categorySlug) {
    items = items.filter((p) => p.categorySlug === filters.categorySlug);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }
  if (filters.minPriceCents != null) {
    items = items.filter((p) => p.priceCents >= filters.minPriceCents!);
  }
  if (filters.maxPriceCents != null) {
    items = items.filter((p) => p.priceCents <= filters.maxPriceCents!);
  }
  switch (filters.sort) {
    case "price-asc":
      items.sort((a, b) => a.priceCents - b.priceCents);
      break;
    case "price-desc":
      items.sort((a, b) => b.priceCents - a.priceCents);
      break;
    case "name":
      items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      break;
    default:
      break;
  }
  return items;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  if (!(await isDatabaseAvailable())) return filterMockProducts(filters);

  return fromDb(filters);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (!(await isDatabaseAvailable())) {
    return mockProducts.filter((p) => p.featured).slice(0, limit);
  }

  try {
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
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
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("active", true)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (!error && data) {
      return mapProduct(parseProductRow(data as Record<string, unknown>));
    }
  } catch {
    /* mock fallback */
  }
  if (!(await isDatabaseAvailable())) {
    return mockProducts.find((p) => p.slug === slug) ?? null;
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
