import {
  getProviderLabel,
  getProviderLogo,
  inferProviderFromModelId,
  type AiProvider,
} from "@/lib/openrouter/providers";

export type { AiProvider };

export type ModelBadge =
  | "Recomendado"
  | "Econômico"
  | "Avançado"
  | "Rápido"
  | "Open source"
  | "Balanceado"
  | "Raciocínio"
  | "Indisponível";

export type CatalogModel = {
  id: string;
  displayName: string;
  provider: AiProvider;
  providerLabel: string;
  descriptionPt: string;
  badge?: ModelBadge;
};

export type EnrichedCatalogModel = CatalogModel & {
  available?: boolean;
  pricing?: { promptPer1M: number; completionPer1M: number };
  contextLength?: number;
  apiDescription?: string;
};

export const OPENROUTER_MODELS_CATALOG: CatalogModel[] = [
  // OpenAI
  {
    id: "openai/gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Modelo compacto e eficiente da OpenAI, ideal para melhorar descrições e textos SEO no dia a dia do admin com bom custo-benefício.",
    badge: "Recomendado",
  },
  {
    id: "openai/gpt-4o",
    displayName: "GPT-4o",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Modelo multimodal de alta qualidade da OpenAI. Use para textos elaborados, criativos ou com nuances complexas.",
    badge: "Avançado",
  },
  {
    id: "openai/gpt-4.1-mini",
    displayName: "GPT-4.1 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Versão mini mais recente da família GPT-4.1, com boa qualidade de redação a custo reduzido.",
    badge: "Econômico",
  },
  {
    id: "openai/gpt-4.1-nano",
    displayName: "GPT-4.1 Nano",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Modelo ultra-leve para tarefas simples de reescrita e ajustes rápidos de SEO em grande volume.",
    badge: "Econômico",
  },
  {
    id: "openai/gpt-4.1",
    displayName: "GPT-4.1",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Modelo flagship da OpenAI para redação de alta qualidade, posts longos e conteúdo técnico.",
    badge: "Avançado",
  },
  {
    id: "openai/gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "GPT-4 otimizado para velocidade e contexto amplo. Indicado para descrições detalhadas de produtos.",
    badge: "Avançado",
  },
  {
    id: "openai/o3-mini",
    displayName: "o3 Mini",
    provider: "openai",
    providerLabel: "OpenAI",
    descriptionPt:
      "Modelo de raciocínio compacto da OpenAI. Útil quando o texto precisa de lógica ou estrutura mais cuidadosa.",
    badge: "Raciocínio",
  },
  // Google
  {
    id: "google/gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Versão lite do Gemini Flash, muito econômica para reescrever descrições curtas e metadados SEO.",
    badge: "Econômico",
  },
  {
    id: "google/gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Modelo rápido do Google com excelente relação custo-benefício para conteúdo de e-commerce.",
    badge: "Rápido",
  },
  {
    id: "google/gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Modelo Pro do Google para textos longos, posts de blog e descrições que exigem mais profundidade.",
    badge: "Avançado",
  },
  {
    id: "google/gemini-2.5-pro-preview",
    displayName: "Gemini 2.5 Pro Preview",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Preview do Gemini Pro com capacidades avançadas de redação e compreensão de contexto.",
    badge: "Avançado",
  },
  {
    id: "google/gemini-3.5-flash",
    displayName: "Gemini 3.5 Flash",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Geração mais recente do Gemini Flash, com respostas ágeis e boa qualidade para textos comerciais.",
    badge: "Rápido",
  },
  {
    id: "google/gemini-3-flash-preview",
    displayName: "Gemini 3 Flash Preview",
    provider: "google",
    providerLabel: "Google",
    descriptionPt:
      "Preview do Gemini 3 Flash para experimentar a geração mais nova do Google em textos da loja.",
    badge: "Rápido",
  },
  // Anthropic
  {
    id: "anthropic/claude-3.5-haiku",
    displayName: "Claude 3.5 Haiku",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Modelo leve da Anthropic, ótimo para revisões rápidas de texto e SEO com tom natural.",
    badge: "Econômico",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    displayName: "Claude Haiku 4.5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Haiku de nova geração, rápido e econômico para melhorias em massa de descrições e snippets SEO.",
    badge: "Econômico",
  },
  {
    id: "anthropic/claude-sonnet-4",
    displayName: "Claude Sonnet 4",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Modelo equilibrado da Anthropic com excelente redação em português para blog e categorias.",
    badge: "Balanceado",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    displayName: "Claude Sonnet 4.5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Sonnet aprimorado com melhor coerência e tom comercial para textos institucionais da loja.",
    badge: "Avançado",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    displayName: "Claude Sonnet 4.6",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Versão mais recente do Sonnet, indicada para conteúdo longo e SEO com alta qualidade.",
    badge: "Avançado",
  },
  {
    id: "anthropic/claude-opus-4.5",
    displayName: "Claude Opus 4.5",
    provider: "anthropic",
    providerLabel: "Anthropic",
    descriptionPt:
      "Modelo premium da Anthropic para textos complexos, storytelling de marca e conteúdo editorial.",
    badge: "Avançado",
  },
  // Meta
  {
    id: "meta-llama/llama-3.1-8b-instruct",
    displayName: "Llama 3.1 8B",
    provider: "meta",
    providerLabel: "Meta",
    descriptionPt:
      "Modelo open source compacto da Meta, econômico para ajustes simples de descrição e títulos.",
    badge: "Econômico",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    displayName: "Llama 3.3 70B",
    provider: "meta",
    providerLabel: "Meta",
    descriptionPt:
      "Modelo open source de grande porte da Meta. Boa opção para textos extensos com custo competitivo.",
    badge: "Open source",
  },
  {
    id: "meta-llama/llama-4-maverick",
    displayName: "Llama 4 Maverick",
    provider: "meta",
    providerLabel: "Meta",
    descriptionPt:
      "Modelo Llama 4 de alta capacidade para redação avançada e conteúdo de catálogo detalhado.",
    badge: "Avançado",
  },
  // DeepSeek
  {
    id: "deepseek/deepseek-chat",
    displayName: "DeepSeek Chat",
    provider: "deepseek",
    providerLabel: "DeepSeek",
    descriptionPt:
      "Modelo econômico com boa capacidade de reescrita. Adequado para melhorias em massa de descrições.",
    badge: "Econômico",
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    displayName: "DeepSeek Chat V3",
    provider: "deepseek",
    providerLabel: "DeepSeek",
    descriptionPt:
      "DeepSeek V3 com qualidade superior mantendo preço acessível para textos de produtos e categorias.",
    badge: "Balanceado",
  },
  {
    id: "deepseek/deepseek-v3.2",
    displayName: "DeepSeek V3.2",
    provider: "deepseek",
    providerLabel: "DeepSeek",
    descriptionPt:
      "Versão mais recente do DeepSeek V3, com melhor fluência em português e textos comerciais.",
    badge: "Balanceado",
  },
  {
    id: "deepseek/deepseek-r1",
    displayName: "DeepSeek R1",
    provider: "deepseek",
    providerLabel: "DeepSeek",
    descriptionPt:
      "Modelo de raciocínio da DeepSeek. Indicado quando o conteúdo precisa de estrutura lógica ou técnica.",
    badge: "Raciocínio",
  },
  // Mistral
  {
    id: "mistralai/mistral-small-3.1-24b-instruct",
    displayName: "Mistral Small 3.1",
    provider: "mistral",
    providerLabel: "Mistral",
    descriptionPt:
      "Modelo europeu balanceado entre qualidade e preço. Funciona bem para SEO e textos institucionais.",
    badge: "Balanceado",
  },
  {
    id: "mistralai/mistral-large-2512",
    displayName: "Mistral Large",
    provider: "mistral",
    providerLabel: "Mistral",
    descriptionPt:
      "Modelo flagship da Mistral para redação de alta qualidade em múltiplos idiomas incluindo português.",
    badge: "Avançado",
  },
  {
    id: "mistralai/mixtral-8x22b-instruct",
    displayName: "Mixtral 8x22B",
    provider: "mistral",
    providerLabel: "Mistral",
    descriptionPt:
      "Modelo MoE open source da Mistral, excelente para textos longos com bom custo por token.",
    badge: "Open source",
  },
  // Qwen
  {
    id: "qwen/qwen-2.5-72b-instruct",
    displayName: "Qwen 2.5 72B",
    provider: "qwen",
    providerLabel: "Qwen",
    descriptionPt:
      "Modelo open source da Alibaba com forte desempenho em redação e tradução para português.",
    badge: "Balanceado",
  },
  {
    id: "qwen/qwen3-235b-a22b",
    displayName: "Qwen3 235B",
    provider: "qwen",
    providerLabel: "Qwen",
    descriptionPt:
      "Modelo MoE de grande escala da Qwen para conteúdo complexo e descrições técnicas de produtos.",
    badge: "Avançado",
  },
  // xAI
  {
    id: "x-ai/grok-4.20",
    displayName: "Grok 4.20",
    provider: "xai",
    providerLabel: "xAI",
    descriptionPt:
      "Modelo avançado da xAI com tom direto e moderno, bom para textos comerciais e chamadas de ação.",
    badge: "Avançado",
  },
  {
    id: "x-ai/grok-build-0.1",
    displayName: "Grok Build",
    provider: "xai",
    providerLabel: "xAI",
    descriptionPt:
      "Modelo rápido da xAI otimizado para tarefas práticas de reescrita e melhoria de textos curtos.",
    badge: "Rápido",
  },
  // Zhipu
  {
    id: "z-ai/glm-4.5",
    displayName: "GLM 4.5",
    provider: "zhipu",
    providerLabel: "Zhipu AI",
    descriptionPt:
      "Modelo GLM da Zhipu AI com boa qualidade de redação e preço competitivo via OpenRouter.",
    badge: "Balanceado",
  },
  // Cohere
  {
    id: "cohere/command-r-plus-08-2024",
    displayName: "Command R+",
    provider: "cohere",
    providerLabel: "Cohere",
    descriptionPt:
      "Modelo empresarial da Cohere focado em textos claros e informativos para e-commerce e SEO.",
    badge: "Balanceado",
  },
];

export { getProviderLogo, inferProviderFromModelId, getProviderLabel };

export function findCatalogModel(id: string): CatalogModel | undefined {
  return OPENROUTER_MODELS_CATALOG.find((m) => m.id === id);
}

const usdFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatUsdPerMillion(value: number): string {
  return `${usdFormatter.format(value)} / 1M tokens`;
}

export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M tokens`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K tokens`;
  return `${count} tokens`;
}

export function openRouterModelPageUrl(modelId: string): string {
  return `https://openrouter.ai/models/${encodeURIComponent(modelId)}`;
}

const BADGE_SORT_ORDER: Record<string, number> = {
  Recomendado: 0,
  Econômico: 1,
  Rápido: 2,
  Balanceado: 3,
  "Open source": 4,
  Raciocínio: 5,
  Avançado: 6,
  Indisponível: 99,
};

export function badgeSortKey(badge?: ModelBadge): number {
  if (!badge) return 50;
  return BADGE_SORT_ORDER[badge] ?? 50;
}
