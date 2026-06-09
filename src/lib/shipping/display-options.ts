import {
  getShippingOptionDisplayLabel,
  type ShippingQuoteSuccess,
} from "@/lib/shipping/calculate";

export type DisplayShippingOption = {
  id: string;
  name: string;
  priceCents: number;
  estimatedDays?: string;
  free?: boolean;
  company?: string;
  companyLogoUrl?: string;
};

function formatDeliveryDays(days: number): string | undefined {
  if (days <= 0) return undefined;
  if (days === 1) return "1 dia útil";
  return `${days} dias úteis`;
}

export function toDisplayShippingOptions(
  quote: ShippingQuoteSuccess,
): DisplayShippingOption[] {
  if (quote.options.length > 0) {
    return quote.options.map((opt) => ({
      id: opt.serviceId,
      name: getShippingOptionDisplayLabel(opt),
      priceCents: quote.freeShippingApplied ? 0 : opt.priceCents,
      estimatedDays: formatDeliveryDays(opt.deliveryDays),
      free: quote.freeShippingApplied || opt.priceCents === 0,
      company: opt.company || undefined,
      companyLogoUrl: opt.companyLogoUrl,
    }));
  }

  if (quote.freeShippingApplied || quote.shippingCents === 0) {
    return [
      {
        id: "free",
        name: "Frete grátis",
        priceCents: 0,
        estimatedDays: quote.estimatedDays,
        free: true,
      },
    ];
  }

  return [
    {
      id: "shipping",
      name: "Frete",
      priceCents: quote.shippingCents,
      estimatedDays:
        quote.estimatedDays !== "Prazo a confirmar" ? quote.estimatedDays : undefined,
      free: false,
    },
  ];
}
