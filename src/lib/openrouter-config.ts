import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";
import { DEFAULT_OPENROUTER_MODEL } from "@/lib/validations/admin";

export type OpenRouterConfig = {
  apiKey: string;
  model: string;
};

export async function getOpenRouterConfig(): Promise<OpenRouterConfig | null> {
  const envKey = process.env.OPENROUTER_API_KEY?.trim();
  const values = await getSettings(Object.values(SETTING_KEYS.openRouter));
  const dbKey = values[SETTING_KEYS.openRouter.apiKey]?.trim() ?? "";
  const apiKey = dbKey || envKey || "";
  if (!apiKey) return null;

  const model =
    values[SETTING_KEYS.openRouter.defaultModel]?.trim() ||
    process.env.OPENROUTER_DEFAULT_MODEL?.trim() ||
    DEFAULT_OPENROUTER_MODEL;

  return { apiKey, model };
}
