import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type StorefrontUtilitySettings = {
  message: string;
  backgroundColor: string;
  textColor: string;
  link: string;
};

const UTILITY_DEFAULTS: StorefrontUtilitySettings = {
  message: "Ajuda e atendimento — WhatsApp",
  backgroundColor: "#7a5a42",
  textColor: "#faf6ef",
  link: "",
};

export async function getStorefrontUtilitySettings(): Promise<StorefrontUtilitySettings> {
  if (!(await isDatabaseAvailable())) return { ...UTILITY_DEFAULTS };

  const keys = Object.values(SETTING_KEYS.storefrontUtility);
  let values: Record<string, string>;
  try {
    values = await getSettings(keys);
  } catch {
    return { ...UTILITY_DEFAULTS };
  }

  const message =
    values[SETTING_KEYS.storefrontUtility.message]?.trim() ||
    UTILITY_DEFAULTS.message;
  const backgroundColor =
    values[SETTING_KEYS.storefrontUtility.bg]?.trim() ||
    UTILITY_DEFAULTS.backgroundColor;
  const textColor =
    values[SETTING_KEYS.storefrontUtility.text]?.trim() ||
    UTILITY_DEFAULTS.textColor;
  const link =
    values[SETTING_KEYS.storefrontUtility.link]?.trim() ||
    UTILITY_DEFAULTS.link;

  return { message, backgroundColor, textColor, link };
}
