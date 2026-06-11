import type { CustomerActivityType } from "@/lib/types/database";

const LABELS: Record<CustomerActivityType, string> = {
  PAGE_VIEW: "Visitou página",
  PRODUCT_VIEW: "Visualizou produto",
  ADD_TO_CART: "Adicionou à sacola",
  REMOVE_FROM_CART: "Removeu da sacola",
  BEGIN_CHECKOUT: "Iniciou checkout",
  SEARCH: "Buscou na loja",
};

export function getActivityLabel(type: CustomerActivityType): string {
  return LABELS[type] ?? type;
}

export function formatActivityDetail(
  type: CustomerActivityType,
  path: string | null,
  productName: string | null,
  metadata: Record<string, unknown> | null,
): string {
  if (type === "PRODUCT_VIEW" && productName) return productName;
  if (type === "SEARCH" && metadata?.query) return String(metadata.query);
  if (type === "ADD_TO_CART" && productName) return productName;
  if (path) return path;
  return "—";
}
