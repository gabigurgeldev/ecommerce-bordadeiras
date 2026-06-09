export const SHIPPING_METHODS = {
  FREE: "FREE",
  FIXED: "FIXED",
} as const;

/** Melhor Envio service IDs are dynamic strings (e.g. "1", "2"). */
export type ShippingMethodId = string;

export type ShippingLineInput = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type ShippingOption = {
  method: ShippingMethodId;
  label: string;
  shippingCents: number;
  estimatedDays: string;
  serviceId?: string;
  company?: string;
  companyLogoUrl?: string;
};

export type ShippingEstimateSuccess = {
  ok: true;
  shippingCents: number;
  estimatedDays: string;
  method?: ShippingMethodId;
  options?: ShippingOption[];
  freeShipping?: boolean;
  shippingServiceName?: string;
};

export type ShippingEstimateResult =
  | ShippingEstimateSuccess
  | { ok: false; error: string };
