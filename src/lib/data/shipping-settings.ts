/**
 * Centralized read/write layer for shipping origin settings.
 */
import { getSettings, setSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type ShippingSettings = {
  originCep: string;
  originStreet: string;
  originNumber: string;
  originComplement: string;
  originNeighborhood: string;
  originCity: string;
  originState: string;
  freeShippingThresholdCents: number | null;
};

export const SHIPPING_SETTINGS_DEFAULTS: ShippingSettings = {
  originCep: "",
  originStreet: "",
  originNumber: "",
  originComplement: "",
  originNeighborhood: "",
  originCity: "",
  originState: "",
  freeShippingThresholdCents: null,
};

const ALL_SHIPPING_KEYS = Object.values(SETTING_KEYS.shipping);

function parseThreshold(raw: string | undefined): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const values = await getSettings([...ALL_SHIPPING_KEYS]);
  const d = SHIPPING_SETTINGS_DEFAULTS;

  return {
    originCep: values[SETTING_KEYS.shipping.originCep]?.trim() ?? d.originCep,
    originStreet: values[SETTING_KEYS.shipping.originStreet]?.trim() ?? d.originStreet,
    originNumber: values[SETTING_KEYS.shipping.originNumber]?.trim() ?? d.originNumber,
    originComplement:
      values[SETTING_KEYS.shipping.originComplement]?.trim() ?? d.originComplement,
    originNeighborhood:
      values[SETTING_KEYS.shipping.originNeighborhood]?.trim() ?? d.originNeighborhood,
    originCity: values[SETTING_KEYS.shipping.originCity]?.trim() ?? d.originCity,
    originState: values[SETTING_KEYS.shipping.originState]?.trim() ?? d.originState,
    freeShippingThresholdCents: parseThreshold(
      values[SETTING_KEYS.shipping.freeShippingThresholdCents],
    ),
  };
}

export async function saveShippingSettings(
  data: ShippingSettings,
): Promise<void> {
  await setSettings({
    [SETTING_KEYS.shipping.originCep]: data.originCep.replace(/\D/g, ""),
    [SETTING_KEYS.shipping.originStreet]: data.originStreet,
    [SETTING_KEYS.shipping.originNumber]: data.originNumber,
    [SETTING_KEYS.shipping.originComplement]: data.originComplement,
    [SETTING_KEYS.shipping.originNeighborhood]: data.originNeighborhood,
    [SETTING_KEYS.shipping.originCity]: data.originCity,
    [SETTING_KEYS.shipping.originState]: data.originState.toUpperCase().slice(0, 2),
    [SETTING_KEYS.shipping.freeShippingThresholdCents]:
      data.freeShippingThresholdCents != null
        ? String(data.freeShippingThresholdCents)
        : "",
  });
}
