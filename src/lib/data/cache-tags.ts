/** Cache tags for storefront catalog reads; admin mutations revalidate them. */
export const CATALOG_TAGS = {
  products: "catalog:products",
  categories: "catalog:categories",
  banners: "catalog:banners",
} as const;

export const ALL_CATALOG_TAGS = Object.values(CATALOG_TAGS);

/**
 * Safety net: admin mutations call revalidateTag, but rows changed straight in
 * the database (seeds, SQL) have no way to invalidate the cache.
 */
export const CATALOG_REVALIDATE_SECONDS = 300;
