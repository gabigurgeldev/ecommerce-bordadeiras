/** Catalog types — align with future Prisma Product/Category/BlogPost models */

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl: string;
  productCount?: number;
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
  featured: boolean;
  categoryId: string;
  categorySlug: string;
  images: string[];
  tags?: string[];
  specs?: Record<string, string>;
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
  slug: string;
  name: string;
  priceCents: number;
  imageUrl: string;
  quantity: number;
};
