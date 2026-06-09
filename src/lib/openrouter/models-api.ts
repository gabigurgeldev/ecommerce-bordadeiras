import { unstable_cache } from "next/cache";
import {
  OPENROUTER_MODELS_CATALOG,
  badgeSortKey,
  type EnrichedCatalogModel,
} from "@/lib/openrouter/models-catalog";
import { PROVIDER_ORDER, type AiProvider } from "@/lib/openrouter/providers";

type OpenRouterApiModel = {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
};

type OpenRouterModelsResponse = {
  data?: OpenRouterApiModel[];
};

function tokenPriceToPerMillion(priceStr: string | undefined): number | undefined {
  if (!priceStr) return undefined;
  const perToken = parseFloat(priceStr);
  if (Number.isNaN(perToken)) return undefined;
  return perToken * 1_000_000;
}

async function fetchOpenRouterModelsList(): Promise<OpenRouterApiModel[]> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];

    const json = (await res.json()) as OpenRouterModelsResponse;
    return json.data ?? [];
  } catch (err) {
    console.error("[fetchOpenRouterModelsList]", err);
    return [];
  }
}

const getCachedOpenRouterModelsList = unstable_cache(
  fetchOpenRouterModelsList,
  ["openrouter-models-list"],
  { revalidate: 3600 },
);

function modelsListToMap(models: OpenRouterApiModel[]): Map<string, OpenRouterApiModel> {
  const map = new Map<string, OpenRouterApiModel>();
  for (const model of models) {
    map.set(model.id, model);
  }
  return map;
}

function providerSortIndex(provider: AiProvider): number {
  const idx = PROVIDER_ORDER.indexOf(provider);
  return idx === -1 ? PROVIDER_ORDER.length : idx;
}

export async function buildEnrichedModelsCatalog(): Promise<EnrichedCatalogModel[]> {
  const apiList = await getCachedOpenRouterModelsList();
  const apiMap = modelsListToMap(apiList);

  const enriched = OPENROUTER_MODELS_CATALOG.map((catalog) => {
    const api = apiMap.get(catalog.id);
    const available = apiMap.size === 0 ? true : Boolean(api);
    const promptPer1M = tokenPriceToPerMillion(api?.pricing?.prompt);
    const completionPer1M = tokenPriceToPerMillion(api?.pricing?.completion);

    return {
      ...catalog,
      displayName: api?.name?.trim() || catalog.displayName,
      available,
      ...(promptPer1M != null && completionPer1M != null
        ? { pricing: { promptPer1M, completionPer1M } }
        : {}),
      ...(api?.context_length ? { contextLength: api.context_length } : {}),
      ...(api?.description ? { apiDescription: api.description } : {}),
    };
  });

  return enriched.sort((a, b) => {
    const availA = a.available !== false ? 0 : 1;
    const availB = b.available !== false ? 0 : 1;
    if (availA !== availB) return availA - availB;

    const prov = providerSortIndex(a.provider) - providerSortIndex(b.provider);
    if (prov !== 0) return prov;

    return badgeSortKey(a.badge) - badgeSortKey(b.badge);
  });
}
