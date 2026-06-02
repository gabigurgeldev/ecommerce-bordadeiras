import { isDatabaseAvailable } from "@/lib/data/db-available";
import { mockProducts } from "@/lib/mock/catalog";
import { prisma } from "@/lib/prisma";
import { mapProduct } from "@/lib/data/mappers";
import type { Product, ProductFilters } from "@/lib/types/catalog";

async function fromDb(filters: ProductFilters): Promise<Product[] | null> {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        status: "ACTIVE",
        ...(filters.categorySlug
          ? { category: { slug: filters.categorySlug } }
          : {}),
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q } },
                { description: { contains: filters.q } },
              ],
            }
          : {}),
        ...(filters.minPriceCents != null
          ? { priceCents: { gte: filters.minPriceCents } }
          : {}),
        ...(filters.maxPriceCents != null
          ? { priceCents: { lte: filters.maxPriceCents } }
          : {}),
      },
      include: {
        category: true,
        productImages: { orderBy: { sortOrder: "asc" } },
      },
      orderBy:
        filters.sort === "price-asc"
          ? { priceCents: "asc" }
          : filters.sort === "price-desc"
            ? { priceCents: "desc" }
            : filters.sort === "name"
              ? { name: "asc" }
              : { createdAt: "desc" },
    });
    return products.map(mapProduct);
  } catch {
    return null;
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

  const db = await fromDb(filters);
  if (db) return db;

  return filterMockProducts(filters);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  if (!(await isDatabaseAvailable())) {
    return mockProducts.filter((p) => p.featured).slice(0, limit);
  }

  try {
    const products = await prisma.product.findMany({
      where: { active: true, status: "ACTIVE" },
      include: {
        category: true,
        productImages: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    if (products.length > 0) return products.map(mapProduct);
  } catch {
    /* mock fallback */
  }
  return mockProducts.filter((p) => p.featured).slice(0, limit);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const product = await prisma.product.findFirst({
      where: { slug, active: true, status: "ACTIVE" },
      include: {
        category: true,
        productImages: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (product) return mapProduct(product);
  } catch {
    /* mock fallback */
  }
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const all = await getProducts({ categorySlug: product.categorySlug });
  return all.filter((p) => p.id !== product.id).slice(0, limit);
}
