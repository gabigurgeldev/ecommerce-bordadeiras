import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioSettings,
  isMelhorEnvioConnected,
} from "@/lib/data/melhor-envio-settings";
import {
  getValidMelhorEnvioAccessToken,
  melhorEnvioAuthHeaders,
} from "@/lib/melhor-envio/auth";
import { getMelhorEnvioApiUrl } from "@/lib/melhor-envio/config";

const CALCULATE_TIMEOUT_MS = 12_000;

const MIN_WEIGHT_KG = 0.3;
const DEFAULT_LENGTH_CM = 16;
const DEFAULT_WIDTH_CM = 11;
const DEFAULT_HEIGHT_CM = 2;

export type MelhorEnvioProductInput = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insuranceValue: number;
  quantity: number;
};

export type MelhorEnvioShippingOption = {
  serviceId: string;
  label: string;
  company: string;
  companyLogoUrl?: string;
  priceCents: number;
  deliveryDays: number;
};

export type MelhorEnvioQuoteResult =
  | { ok: true; options: MelhorEnvioShippingOption[] }
  | { ok: false; error: string; fallbackMessage: string };

type MeCalculateProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

type MeCalculateResponseItem = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: {
    name?: string;
    picture?: string;
  };
  error?: string;
};

function parsePriceToCents(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function toMeProducts(products: MelhorEnvioProductInput[]): MeCalculateProduct[] {
  return products.map((p) => ({
    id: p.id,
    width: Math.max(p.width, 1),
    height: Math.max(p.height, 1),
    length: Math.max(p.length, 1),
    weight: Math.max(p.weight, MIN_WEIGHT_KG),
    insurance_value: Math.max(p.insuranceValue, 0),
    quantity: Math.max(p.quantity, 1),
  }));
}

function mapResponseItem(item: MeCalculateResponseItem): MelhorEnvioShippingOption | null {
  if (item.error) return null;

  const priceCents = parsePriceToCents(item.custom_price ?? item.price);
  if (priceCents <= 0) return null;

  const deliveryDays = item.custom_delivery_time ?? item.delivery_time ?? 0;

  return {
    serviceId: String(item.id),
    label: item.name,
    company: item.company?.name ?? "Transportadora",
    companyLogoUrl: item.company?.picture,
    priceCents,
    deliveryDays,
  };
}

export function buildMelhorEnvioProductsFromCart(
  items: Array<{
    productId: string;
    quantity: number;
    priceCents?: number;
    weightGrams: number | null;
    lengthCm: number | null;
    widthCm: number | null;
    heightCm: number | null;
  }>,
): MelhorEnvioProductInput[] {
  return items.map((item) => ({
    id: item.productId,
    width: item.widthCm ?? DEFAULT_WIDTH_CM,
    height: item.heightCm ?? DEFAULT_HEIGHT_CM,
    length: item.lengthCm ?? DEFAULT_LENGTH_CM,
    weight: Math.max((item.weightGrams ?? 300) / 1000, MIN_WEIGHT_KG),
    insuranceValue: (item.priceCents ?? 0) / 100,
    quantity: item.quantity,
  }));
}

export async function calculateMelhorEnvioShipment(input: {
  fromCep: string;
  toCep: string;
  products: MelhorEnvioProductInput[];
}): Promise<MelhorEnvioQuoteResult> {
  const originCep = input.fromCep.replace(/\D/g, "");
  const destCep = input.toCep.replace(/\D/g, "");

  if (originCep.length !== 8) {
    return {
      ok: false,
      error: "CEP de origem inválido",
      fallbackMessage: "Configure o CEP de origem em Admin → Configurações → Frete e Envio.",
    };
  }

  if (destCep.length !== 8) {
    return {
      ok: false,
      error: "CEP de destino inválido",
      fallbackMessage: "Informe um CEP válido com 8 dígitos.",
    };
  }

  if (input.products.length === 0) {
    return {
      ok: false,
      error: "Sem produtos",
      fallbackMessage: "Adicione produtos para calcular o frete.",
    };
  }

  const settings = await getMelhorEnvioSettings();
  if (!isMelhorEnvioConnected(settings)) {
    return {
      ok: false,
      error: "Melhor Envio não conectado",
      fallbackMessage:
        "Conecte o Melhor Envio em Admin → Configurações → Frete e Envio.",
    };
  }

  const accessToken = await getValidMelhorEnvioAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      error: "Token Melhor Envio inválido",
      fallbackMessage:
        "Sessão do Melhor Envio expirou. Reconecte em Admin → Configurações → Frete e Envio.",
    };
  }

  const env = getActiveMelhorEnvioEnvironment(settings);
  const url = getMelhorEnvioApiUrl(env, "/api/v2/me/shipment/calculate");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CALCULATE_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: melhorEnvioAuthHeaders(accessToken),
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: destCep },
        products: toMeProducts(input.products),
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[melhor-envio] calculate failed:", res.status, text.slice(0, 300));
      return {
        ok: false,
        error: `Melhor Envio HTTP ${res.status}`,
        fallbackMessage: "Não foi possível calcular o frete. Tente novamente em instantes.",
      };
    }

    const data = (await res.json()) as MeCalculateResponseItem[];
    const options = (Array.isArray(data) ? data : [])
      .map(mapResponseItem)
      .filter((o): o is MelhorEnvioShippingOption => o != null)
      .sort((a, b) => a.priceCents - b.priceCents);

    if (options.length === 0) {
      return {
        ok: false,
        error: "Nenhuma opção de frete",
        fallbackMessage:
          "Nenhuma transportadora disponível para este CEP. Verifique peso e dimensões.",
      };
    }

    return { ok: true, options };
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "AbortError";
    console.error("[melhor-envio] calculate error:", err);
    return {
      ok: false,
      error: timedOut ? "Melhor Envio timeout" : "Melhor Envio indisponível",
      fallbackMessage: timedOut
        ? "O Melhor Envio demorou para responder. Tente novamente."
        : "Serviço de frete temporariamente indisponível.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
