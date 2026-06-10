import { getShippingSettings } from "@/lib/data/shipping-settings";
import { isMelhorEnvioConnected } from "@/lib/data/melhor-envio-settings";
import { getMelhorEnvioSettings } from "@/lib/data/melhor-envio-settings";
import {
  buildMelhorEnvioProductsFromCart,
  calculateMelhorEnvioShipment,
  type MelhorEnvioShippingOption,
} from "@/lib/melhor-envio/shipment";
import { normalizeCep } from "@/lib/shipping/cep";
import { ShippingMode } from "@/lib/types/database";

export type ShippingCartItem = {
  productId: string;
  quantity: number;
  priceCents?: number;
  weightGrams: number | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  shippingMode: ShippingMode;
  fixedShippingCents: number | null;
};

export type ShippingOption = MelhorEnvioShippingOption;

export type ShippingQuoteSuccess = {
  ok: true;
  options: ShippingOption[];
  shippingCents: number;
  estimatedDays: string;
  freeShippingApplied: boolean;
};

export type ShippingQuoteFailure = {
  ok: false;
  error: string;
  fallbackMessage?: string;
};

export type ShippingQuoteResult = ShippingQuoteSuccess | ShippingQuoteFailure;

function formatEstimatedDays(days: number): string {
  if (days <= 0) return "Prazo a confirmar";
  if (days === 1) return "1 dia útil";
  return `${days} dias úteis`;
}

function formatEstimatedDaysRange(options: ShippingOption[]): string {
  const days = options.map((o) => o.deliveryDays).filter((d) => d > 0);
  if (days.length === 0) return "Prazo a confirmar";
  const min = Math.min(...days);
  const max = Math.max(...days);
  if (min === max) return formatEstimatedDays(min);
  return `${min}–${max} dias úteis`;
}

function validateFixedItems(items: ShippingCartItem[]): ShippingQuoteFailure | null {
  const invalid = items.filter(
    (i) =>
      i.shippingMode === ShippingMode.FIXED &&
      (i.fixedShippingCents == null || i.fixedShippingCents <= 0),
  );
  if (invalid.length === 0) return null;
  return {
    ok: false,
    error: "Frete fixo não configurado",
    fallbackMessage:
      "Este produto está com frete fixo sem valor definido. Configure em Admin → Produtos.",
  };
}

function sumFixedShipping(items: ShippingCartItem[]): number {
  return items.reduce((sum, item) => {
    if (item.shippingMode !== ShippingMode.FIXED) return sum;
    return sum + (item.fixedShippingCents ?? 0);
  }, 0);
}

function ensureAtLeastOneOption(
  options: ShippingOption[],
  shippingCents: number,
  estimatedDays: string,
  freeShippingApplied: boolean,
): ShippingOption[] {
  if (options.length > 0) return options;
  if (freeShippingApplied || shippingCents === 0) {
    return [
      {
        serviceId: "FREE",
        label: "Frete grátis",
        company: "",
        priceCents: 0,
        deliveryDays: 0,
      },
    ];
  }
  return [
    {
      serviceId: "SHIPPING",
      label: "Frete",
      company: "",
      priceCents: shippingCents,
      deliveryDays: 0,
    },
  ];
}

function cartSubtotalCents(items: ShippingCartItem[]): number {
  return items.reduce(
    (sum, item) => sum + (item.priceCents ?? 0) * item.quantity,
    0,
  );
}

function applyFreeShippingThreshold(
  shippingCents: number,
  subtotalCents: number,
  threshold: number | null,
): { cents: number; applied: boolean } {
  if (threshold == null || threshold <= 0) {
    return { cents: shippingCents, applied: false };
  }
  if (subtotalCents >= threshold) {
    return { cents: 0, applied: true };
  }
  return { cents: shippingCents, applied: false };
}

function formatOptionLabel(opt: ShippingOption): string {
  return opt.company ? `${opt.label} · ${opt.company}` : opt.label;
}

async function quoteMelhorEnvioForItems(
  destinationCep: string,
  calculatedItems: ShippingCartItem[],
): Promise<ShippingQuoteResult> {
  const [shippingSettings, meSettings] = await Promise.all([
    getShippingSettings(),
    getMelhorEnvioSettings(),
  ]);

  if (!isMelhorEnvioConnected(meSettings)) {
    return {
      ok: false,
      error: "Melhor Envio não conectado",
      fallbackMessage:
        "Cole o Access Token em Admin → Configurações → Frete e Envio.",
    };
  }

  const originCep = normalizeCep(shippingSettings.originCep);
  if (!originCep) {
    return {
      ok: false,
      error: "CEP de origem não configurado",
      fallbackMessage: "Configure o endereço de origem da loja para calcular o frete.",
    };
  }

  const quote = await calculateMelhorEnvioShipment({
    fromCep: originCep,
    toCep: destinationCep,
    products: buildMelhorEnvioProductsFromCart(calculatedItems),
  });

  if (!quote.ok) {
    return {
      ok: false,
      error: quote.error,
      fallbackMessage: quote.fallbackMessage,
    };
  }

  return {
    ok: true,
    options: quote.options,
    shippingCents: quote.options[0]?.priceCents ?? 0,
    estimatedDays: formatEstimatedDaysRange(quote.options),
    freeShippingApplied: false,
  };
}

/**
 * Calculates shipping for a cart, combining FREE / FIXED / Melhor Envio lines.
 */
export async function calculateShippingForCart(
  destinationCep: string,
  items: ShippingCartItem[],
  subtotalCents?: number,
): Promise<ShippingQuoteResult> {
  const cep = normalizeCep(destinationCep);
  if (!cep) {
    return {
      ok: false,
      error: "CEP inválido",
      fallbackMessage: "Informe um CEP válido com 8 dígitos.",
    };
  }

  if (items.length === 0) {
    return {
      ok: false,
      error: "Carrinho vazio",
      fallbackMessage: "Adicione produtos ao carrinho para calcular o frete.",
    };
  }

  const settings = await getShippingSettings();
  const subtotal = subtotalCents ?? cartSubtotalCents(items);

  const freeItems = items.filter((i) => i.shippingMode === ShippingMode.FREE);
  const fixedItems = items.filter((i) => i.shippingMode === ShippingMode.FIXED);
  const calculatedItems = items.filter(
    (i) => i.shippingMode === ShippingMode.CORREIOS,
  );

  const fixedValidation = validateFixedItems(fixedItems);
  if (fixedValidation) return fixedValidation;

  const fixedCents = sumFixedShipping(fixedItems);

  if (
    calculatedItems.length === 0 &&
    fixedItems.length === 0 &&
    freeItems.length === items.length
  ) {
    const threshold = applyFreeShippingThreshold(
      0,
      subtotal,
      settings.freeShippingThresholdCents,
    );
    return {
      ok: true,
      options: [
        {
          serviceId: "FREE",
          label: "Frete grátis",
          company: "",
          priceCents: threshold.cents,
          deliveryDays: 0,
        },
      ],
      shippingCents: threshold.cents,
      estimatedDays: "Frete grátis",
      freeShippingApplied: threshold.applied || true,
    };
  }

  let meOptions: ShippingOption[] = [];
  let meCents = 0;
  let estimatedDays = "Prazo a confirmar";

  if (calculatedItems.length > 0) {
    const meQuote = await quoteMelhorEnvioForItems(cep, calculatedItems);
    if (!meQuote.ok) {
      if (fixedItems.length === 0 && freeItems.length === 0) {
        return meQuote;
      }
      console.warn("[calculateShippingForCart] Melhor Envio partial failure:", meQuote.error);
    } else {
      meOptions = meQuote.options;
      meCents = meQuote.shippingCents;
      estimatedDays = meQuote.estimatedDays;
    }
  } else if (fixedCents > 0) {
    estimatedDays = "Entrega conforme transportadora";
  } else {
    estimatedDays = "Frete grátis";
  }

  const rawTotal = fixedCents + meCents;
  const threshold = applyFreeShippingThreshold(
    rawTotal,
    subtotal,
    settings.freeShippingThresholdCents,
  );

  const adjustedOptions = meOptions.map((opt) => ({
    ...opt,
    priceCents: opt.priceCents + fixedCents,
  }));

  if (threshold.applied) {
    return {
      ok: true,
      options:
        adjustedOptions.length > 0
          ? adjustedOptions.map((opt) => ({ ...opt, priceCents: 0 }))
          : [
              {
                serviceId: "FREE",
                label: "Frete grátis",
                company: "",
                priceCents: 0,
                deliveryDays: 0,
              },
            ],
      shippingCents: 0,
      estimatedDays: "Frete grátis",
      freeShippingApplied: true,
    };
  }

  const finalOptions = ensureAtLeastOneOption(
    adjustedOptions.length > 0
      ? adjustedOptions
      : threshold.cents > 0
        ? [
            {
              serviceId: "FIXED",
              label: "Frete fixo",
              company: "",
              priceCents: threshold.cents,
              deliveryDays: 0,
            },
          ]
        : [],
    threshold.cents,
    estimatedDays,
    false,
  );

  return {
    ok: true,
    options: finalOptions,
    shippingCents: threshold.cents,
    estimatedDays,
    freeShippingApplied: false,
  };
}

export function getShippingOptionDisplayLabel(opt: ShippingOption): string {
  return formatOptionLabel(opt);
}

/**
 * Calculates shipping options for a single product (PDP calculator).
 */
export async function calculateShippingForProduct(
  destinationCep: string,
  product: Omit<ShippingCartItem, "productId"> & { productId?: string },
): Promise<ShippingQuoteResult> {
  return calculateShippingForCart(destinationCep, [
    {
      productId: product.productId ?? "single",
      quantity: product.quantity,
      priceCents: product.priceCents,
      weightGrams: product.weightGrams,
      lengthCm: product.lengthCm,
      widthCm: product.widthCm,
      heightCm: product.heightCm,
      shippingMode: product.shippingMode,
      fixedShippingCents: product.fixedShippingCents,
    },
  ]);
}
