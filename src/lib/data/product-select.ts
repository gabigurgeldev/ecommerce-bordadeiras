export const PRODUCT_LIST_SELECT =
  "*, Category(*), ProductImage(*)";

export const PRODUCT_DETAIL_SELECT =
  "*, Category(*), ProductImage(*), ProductOption(*, ProductOptionValue(*)), ProductVariant(*)";

/** PostgREST errors when variant tables or FKs are not migrated yet. */
export function isProductDetailSelectError(error: { code?: string; message?: string }): boolean {
  const message = error.message ?? "";
  return (
    error.code === "PGRST200" ||
    message.includes("ProductOption") ||
    message.includes("ProductVariant") ||
    message.includes("Could not find a relationship")
  );
}
