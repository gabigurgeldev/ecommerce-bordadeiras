import type { BlogPost, Category, Product } from "@/lib/types/catalog";
import {
  ShippingMode,
  type BlogPost as DbBlogPost,
  type Category as DbCategory,
  type ProductWithRelations,
} from "@/lib/types/database";

export function mapCategory(c: DbCategory & { _count?: { products: number } }): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? undefined,
    seoTitle: c.seoTitle ?? undefined,
    seoDescription: c.seoDescription ?? undefined,
    imageUrl:
      c.imageUrl ??
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80",
    productCount: c._count?.products,
  };
}

export function mapProduct(p: ProductWithRelations): Product {
  const imagesFromRelation = [...(p.productImages ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)
    .map((i) => i.url);
  const legacyImages = Array.isArray(p.images)
    ? (p.images as string[])
    : typeof p.images === "object" && p.images !== null
      ? Object.values(p.images as Record<string, string>)
      : [];

  const activeVariants = (p.productVariants ?? [])
    .filter((v) => v.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const variantPrices = activeVariants
    .map((v) => v.priceCents ?? p.priceCents)
    .filter((n) => n > 0);
  const displayPriceCents =
    variantPrices.length > 0 ? Math.min(...variantPrices) : p.priceCents;

  const options = (p.productOptions ?? [])
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((o) => ({
      name: o.name,
      values: [...(o.values ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((v) => v.value),
    }));

  const specs: Record<string, string> = {};
  if (p.weightGrams) specs.Peso = `${(p.weightGrams / 1000).toFixed(2)} kg`;
  if (p.lengthCm && p.widthCm && p.heightCm) {
    specs.Dimensões = `${p.lengthCm} × ${p.widthCm} × ${p.heightCm} cm`;
  }
  if (p.brand) specs.Marca = p.brand;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    shortDescription: p.seoDescription ?? p.description?.replace(/<[^>]+>/g, " ").slice(0, 160),
    priceCents: displayPriceCents,
    compareAtCents: p.compareCents ?? undefined,
    sku: p.sku ?? undefined,
    stock: p.stock,
    stockUnlimited: p.stockUnlimited ?? false,
    showPrice: p.showPrice ?? true,
    featured: p.status === "ACTIVE" && !!p.compareCents,
    categoryId: p.categoryId ?? "",
    categorySlug: p.category?.slug ?? "geral",
    tags: p.tags?.length ? p.tags : undefined,
    brand: p.brand ?? undefined,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    videoUrls: p.videoUrls?.length ? p.videoUrls : (p.videoUrl ? [p.videoUrl] : []),
    specs: Object.keys(specs).length ? specs : undefined,
    options: options.length ? options : undefined,
    variants: activeVariants.length
      ? activeVariants.map((v) => ({
          id: v.id,
          sku: v.sku ?? undefined,
          priceCents: v.priceCents ?? undefined,
          compareAtCents: v.compareCents ?? undefined,
          stock: v.stock,
          stockUnlimited: v.stockUnlimited,
          attributes: Object.fromEntries(
            Object.entries(v.attributes as Record<string, string>).map(([k, val]) => [
              k,
              String(val),
            ]),
          ),
          imageUrl: v.imageUrl ?? undefined,
          active: v.active,
        }))
      : undefined,
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

  const rawOptions = (row.ProductOption ?? row.productOptions) as
    | Record<string, unknown>[]
    | null;
  const optionList = Array.isArray(rawOptions) ? rawOptions : [];
  const productOptions = optionList.map((opt) => {
    const vals = (opt.ProductOptionValue ?? opt.values) as Record<string, unknown>[] | null;
    const valueList = Array.isArray(vals) ? vals : [];
    return {
      ...(opt as unknown as ProductWithRelations["productOptions"] extends (infer T)[] | undefined
        ? T
        : never),
      values: valueList.map((v) => ({
        ...(v as unknown as { id: string; optionId: string; value: string; sortOrder: number }),
      })),
    };
  });

  const rawVariants = (row.ProductVariant ?? row.productVariants) as
    | Record<string, unknown>[]
    | null;
  const variantList = Array.isArray(rawVariants) ? rawVariants : [];

  const base = row as unknown as ProductWithRelations;

  return {
    ...base,
    tags: Array.isArray(base.tags) ? base.tags : [],
    showPrice: base.showPrice ?? true,
    stockUnlimited: base.stockUnlimited ?? false,
    shippingMode: (base.shippingMode as ProductWithRelations["shippingMode"]) ?? ShippingMode.CORREIOS,
    fixedShippingCents: base.fixedShippingCents ?? null,
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
      ...(img as unknown as NonNullable<ProductWithRelations["productImages"]>[number]),
      createdAt: new Date(String(img.createdAt)),
    })),
    productOptions,
    productVariants: variantList.map((v) => ({
      ...(v as unknown as NonNullable<ProductWithRelations["productVariants"]>[0]),
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
