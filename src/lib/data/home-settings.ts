import { isDatabaseAvailable } from "@/lib/data/db-available";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type HomeSettings = {
  showCategoriesSection: boolean;
};

const HOME_DEFAULTS: HomeSettings = {
  showCategoriesSection: true,
};

export async function getHomeSettings(): Promise<HomeSettings> {
  if (!(await isDatabaseAvailable())) return { ...HOME_DEFAULTS };

  const keys = Object.values(SETTING_KEYS.home);
  let values: Record<string, string>;
  try {
    values = await getSettings(keys);
  } catch {
    return { ...HOME_DEFAULTS };
  }

  const raw = values[SETTING_KEYS.home.showCategoriesSection];
  // Chave nunca salva ("") usa default true; só "false" explícito oculta a sessão.
  const showCategoriesSection =
    raw === "" ? HOME_DEFAULTS.showCategoriesSection : raw !== "false";

  return { showCategoriesSection };
}
