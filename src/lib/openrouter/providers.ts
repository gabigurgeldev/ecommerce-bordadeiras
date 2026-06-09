export const AI_PROVIDERS = {
  openai: { label: "OpenAI", logo: "/ai-providers/openai.svg" },
  google: { label: "Google", logo: "/ai-providers/google.svg" },
  anthropic: { label: "Anthropic", logo: "/ai-providers/anthropic.svg" },
  meta: { label: "Meta", logo: "/ai-providers/meta.svg" },
  deepseek: { label: "DeepSeek", logo: "/ai-providers/deepseek.svg" },
  mistral: { label: "Mistral", logo: "/ai-providers/mistral.svg" },
  qwen: { label: "Qwen", logo: "/ai-providers/qwen.svg" },
  xai: { label: "xAI", logo: "/ai-providers/xai.svg" },
  cohere: { label: "Cohere", logo: "/ai-providers/cohere.svg" },
  zhipu: { label: "Zhipu AI", logo: "/ai-providers/zhipu.svg" },
  microsoft: { label: "Microsoft", logo: "/ai-providers/microsoft.svg" },
} as const;

export type AiProvider = keyof typeof AI_PROVIDERS;

/** Provider order for grouped UI */
export const PROVIDER_ORDER: AiProvider[] = [
  "openai",
  "google",
  "anthropic",
  "meta",
  "deepseek",
  "mistral",
  "qwen",
  "xai",
  "zhipu",
  "cohere",
  "microsoft",
];

const PREFIX_TO_PROVIDER: Array<{ prefix: string; provider: AiProvider }> = [
  { prefix: "openai/", provider: "openai" },
  { prefix: "google/", provider: "google" },
  { prefix: "anthropic/", provider: "anthropic" },
  { prefix: "meta-llama/", provider: "meta" },
  { prefix: "meta/", provider: "meta" },
  { prefix: "deepseek/", provider: "deepseek" },
  { prefix: "mistralai/", provider: "mistral" },
  { prefix: "qwen/", provider: "qwen" },
  { prefix: "x-ai/", provider: "xai" },
  { prefix: "z-ai/", provider: "zhipu" },
  { prefix: "thudm/", provider: "zhipu" },
  { prefix: "cohere/", provider: "cohere" },
  { prefix: "microsoft/", provider: "microsoft" },
];

export function getProviderLogo(provider: AiProvider): string {
  return AI_PROVIDERS[provider].logo;
}

export function getProviderLabel(provider: AiProvider): string {
  return AI_PROVIDERS[provider].label;
}

export function inferProviderFromModelId(id: string): AiProvider | null {
  const lower = id.toLowerCase();
  for (const { prefix, provider } of PREFIX_TO_PROVIDER) {
    if (lower.startsWith(prefix)) return provider;
  }
  return null;
}
