import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioSettings,
  isMelhorEnvioConnected,
} from "@/lib/data/melhor-envio-settings";
import { resolveValidMelhorEnvioCredentials } from "@/lib/melhor-envio/auth";
import { getMelhorEnvioApiUrl, MELHOR_ENVIO_USER_AGENT } from "@/lib/melhor-envio/config";
import { melhorEnvioHttpsPost } from "@/lib/melhor-envio/http";

const CALCULATE_TIMEOUT_MS =
  process.env.NODE_ENV === "production" ? 20_000 : 12_000;

const MIN_WEIGHT_KG = 0.3;
const DEFAULT_LENGTH_CM = 16;
const DEFAULT_WIDTH_CM = 11;
const DEFAULT_HEIGHT_CM = 2;
/** Limite típico de valor segurado (R$) aceito pelas transportadoras na cotação ME. */
const MAX_INSURANCE_VALUE_REAIS = 4477;
/** Valor mínimo exigido pela API ME — 0 invalida cotações. */
const MIN_INSURANCE_VALUE_REAIS = 0.01;

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
  price?: string | number;
  custom_price?: string | number;
  delivery_time?: number | string;
  custom_delivery_time?: number | string;
  company?: {
    name?: string;
    picture?: string;
  };
  error?: string;
};

function parsePriceToCents(value: string | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.round(value * 100) : 0;
  }
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function parseDeliveryDays(value: number | string | undefined): number {
  if (value == null) return 0;
  const n =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function toMeProducts(products: MelhorEnvioProductInput[]): MeCalculateProduct[] {
  return products.map((p) => ({
    id: p.id,
    width: Math.max(p.width, 1),
    height: Math.max(p.height, 1),
    length: Math.max(p.length, 1),
    weight: Math.max(p.weight, MIN_WEIGHT_KG),
    insurance_value: Math.max(p.insuranceValue, MIN_INSURANCE_VALUE_REAIS),
    quantity: Math.max(p.quantity, 1),
  }));
}

function mapResponseItem(item: MeCalculateResponseItem): MelhorEnvioShippingOption | null {
  try {
    if (item.error) return null;

    const priceCents = parsePriceToCents(item.custom_price ?? item.price);
    if (priceCents <= 0) return null;

    const deliveryDays = parseDeliveryDays(
      item.custom_delivery_time ?? item.delivery_time,
    );

    return {
      serviceId: String(item.id),
      label: item.name,
      company: item.company?.name ?? "Transportadora",
      companyLogoUrl: item.company?.picture,
      priceCents,
      deliveryDays,
    };
  } catch (err) {
    console.warn("[melhor-envio] failed to map quote item:", err);
    return null;
  }
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
    insuranceValue: Math.max(
      MIN_INSURANCE_VALUE_REAIS,
      Math.min(
        ((item.priceCents ?? 0) * item.quantity) / 100,
        MAX_INSURANCE_VALUE_REAIS,
      ),
    ),
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
        "Cole o Access Token em Admin → Configurações → Frete e Envio.",
    };
  }

  const credentials = await resolveValidMelhorEnvioCredentials();
  if (!credentials) {
    const preferred = getActiveMelhorEnvioEnvironment(settings);
    const hasAnyToken =
      Boolean(settings.sandbox.accessToken) ||
      Boolean(settings.production.accessToken);
    return {
      ok: false,
      error: "Token Melhor Envio inválido",
      fallbackMessage: hasAnyToken
        ? `Token Melhor Envio expirado ou incompatível com o ambiente ${preferred === "sandbox" ? "Sandbox" : "Produção"}. Gere um novo token e confira o toggle Modo sandbox em Admin → Configurações.`
        : "Cole o Access Token em Admin → Configurações → Frete e Envio.",
    };
  }

  const { accessToken, env } = credentials;
  const url = getMelhorEnvioApiUrl(env, "/api/v2/me/shipment/calculate");
  const body = JSON.stringify({
    from: { postal_code: originCep },
    to: { postal_code: destCep },
    products: toMeProducts(input.products),
  });

  try {
    const res = await melhorEnvioHttpsPost(
      url,
      body,
      {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": MELHOR_ENVIO_USER_AGENT,
        Authorization: `Bearer ${accessToken}`,
      },
      CALCULATE_TIMEOUT_MS,
    );

    if (res.status < 200 || res.status >= 300) {
      console.error("[melhor-envio] calculate failed:", res.status, res.body.slice(0, 300));
      if (res.status === 401) {
        const envLabel = env === "sandbox" ? "Sandbox" : "Produção";
        return {
          ok: false,
          error: "Melhor Envio HTTP 401",
          fallbackMessage:
            `Token inválido para o ambiente ${envLabel}. Gere o token no painel correto (sandbox.melhorenvio.com.br ≠ melhorenvio.com.br) ou ajuste o toggle Modo sandbox em Admin → Configurações → Frete e Envio.`,
        };
      }
      return {
        ok: false,
        error: `Melhor Envio HTTP ${res.status}`,
        fallbackMessage: "Não foi possível calcular o frete. Tente novamente em instantes.",
      };
    }

    let data: MeCalculateResponseItem[];
    try {
      const parsed = JSON.parse(res.body) as unknown;
      data = Array.isArray(parsed) ? parsed : [];
    } catch {
      console.error("[melhor-envio] invalid JSON:", res.body.slice(0, 300));
      return {
        ok: false,
        error: "Resposta inválida do Melhor Envio",
        fallbackMessage:
          "Resposta inesperada do Melhor Envio. Verifique o token e o ambiente (sandbox vs produção) em Admin → Configurações.",
      };
    }

    const options = data
      .map(mapResponseItem)
      .filter((o): o is MelhorEnvioShippingOption => o != null)
      .sort((a, b) => a.priceCents - b.priceCents);

    if (options.length === 0) {
      const firstError = data.find((i) => i.error)?.error;
      console.error(
        "[melhor-envio] no shipping options:",
        res.body.slice(0, 500),
      );
      return {
        ok: false,
        error: "Nenhuma opção de frete",
        fallbackMessage:
          firstError ??
          "Nenhuma transportadora disponível para este CEP. Verifique peso e dimensões.",
      };
    }

    return { ok: true, options };
  } catch (err) {
    const timedOut =
      err instanceof Error && err.message.includes("timeout");
    console.error("[melhor-envio] calculate error:", err);
    return {
      ok: false,
      error: timedOut ? "Melhor Envio timeout" : "Melhor Envio indisponível",
      fallbackMessage: timedOut
        ? "O Melhor Envio demorou para responder. Tente novamente."
        : "Serviço de frete temporariamente indisponível.",
    };
  }
}
