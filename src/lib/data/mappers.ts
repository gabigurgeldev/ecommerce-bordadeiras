import type { BlogPost, Category, Product } from "@/lib/types/catalog";
import type {
  BlogPost as DbBlogPost,
  Category as DbCategory,
  ProductWithRelations,
} from "@/lib/types/database";

export function mapCategory(c: DbCategory & { _count?: { products: number } }): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    imageUrl:
      c.imageUrl ??
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    productCount: c._count?.products,
  };
}

export function mapProduct(p: ProductWithRelations): Product {
  const imagesFromRelation = [...p.productImages]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
    .map((i) => i.url);
  const legacyImages = Array.isArray(p.images)
    ? (p.images as string[])
    : typeof p.images === "object" && p.images !== null
      ? Object.values(p.images as Record<string, string>)
      : [];

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    shortDescription: p.description?.slice(0, 120),
    priceCents: p.priceCents,
    compareAtCents: p.compareCents ?? undefined,
    sku: p.sku ?? undefined,
    stock: p.stock,
    featured: p.status === "ACTIVE" && !!p.compareCents,
    categoryId: p.categoryId ?? "",
    categorySlug: p.category?.slug ?? "geral",
    images:
      imagesFromRelation.length > 0
        ? imagesFromRelation
        : legacyImages.length > 0
          ? legacyImages
          : ["https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"],
  };
}

export function mapBlogPost(p: DbBlogPost): BlogPost {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? "",
    content: p.content,
    coverImage:
      p.coverImage ??
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
    author: "Equipe Bordadeiras",
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
    tags: [],
  };
}

/** Parse PostgREST row dates on product/category relations */
export function parseProductRow(row: Record<string, unknown>): ProductWithRelations {
  const category = (row.Category ?? row.category) as Record<string, unknown> | null;
  const images = (row.ProductImage ?? row.productImages ?? row.images) as
    | Record<string, unknown>[]
    | null;
  const imageList = Array.isArray(images) ? images : [];
  return {
    ...(row as unknown as ProductWithRelations),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    category: category
      ? {
          ...(category as unknown as DbCategory),
          createdAt: new Date(String(category.createdAt)),
          updatedAt: new Date(String(category.updatedAt)),
        }
      : null,
    productImages: imageList.map((img) => ({
      ...(img as unknown as ProductWithRelations["productImages"][0]),
      createdAt: new Date(String(img.createdAt)),
    })),
  };
}

export function parseCategoryRow(
  row: Record<string, unknown>,
  productCount?: number,
): DbCategory & { _count?: { products: number } } {
  return {
    ...(row as unknown as DbCategory),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    ...(productCount != null ? { _count: { products: productCount } } : {}),
  };
}

export function parseBlogPostRow(row: Record<string, unknown>): DbBlogPost {
  return {
    ...(row as unknown as DbBlogPost),
    createdAt: new Date(String(row.createdAt)),
    updatedAt: new Date(String(row.updatedAt)),
    publishedAt: row.publishedAt ? new Date(String(row.publishedAt)) : null,
  };
}
