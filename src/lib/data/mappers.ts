import type { BlogPost, Category, Product } from "@/lib/types/catalog";
import type { BlogPost as PrismaBlogPost, Category as PrismaCategory, Product as PrismaProduct } from "@prisma/client";

type ProductWithRelations = PrismaProduct & {
  category: PrismaCategory | null;
  productImages: { url: string; isPrimary: boolean; sortOrder: number }[];
};

export function mapCategory(c: PrismaCategory & { _count?: { products: number } }): Category {
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

export function mapBlogPost(p: PrismaBlogPost): BlogPost {
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
