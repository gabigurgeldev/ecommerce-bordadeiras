/** Catalog types — align with future Prisma Product/Category/BlogPost models */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  seoTitle?: string;
  seoDescription?: string;
  productCount?: number;
};

export type ProductVariant = {
  id: string;
  sku?: string;
  priceCents?: number;
  compareAtCents?: number;
  costCents?: number;
  stock: number;
  stockUnlimited: boolean;
  lowStockThreshold?: number;
  soldCount?: number;
  attributes: Record<string, string>;
  imageUrl?: string;
  active: boolean;
};

export type ProductOption = {
  name: string;
  values: string[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  priceCents: number;
  compareAtCents?: number;
  sku?: string;
  stock: number;
  stockUnlimited: boolean;
  showPrice: boolean;
  featured: boolean;
  categoryId: string;
  categorySlug: string;
  images: string[];
  tags?: string[];
  brand?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** @deprecated Use videoUrls instead */
  videoUrl?: string;
  /** Array de URLs de vídeos (YouTube/Vimeo) */
  videoUrls: string[];
  specs?: Record<string, string>;
  variants?: ProductVariant[];
  options?: ProductOption[];
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  tags?: string[];
};

export type ProductFilters = {
  categorySlug?: string;
  q?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  inStock?: boolean;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
};

export type ShippingAddress = {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CartLineInput = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
};
