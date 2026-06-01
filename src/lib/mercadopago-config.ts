import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type MercadoPagoConfig = {
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
};

export async function getMercadoPagoSettingsFromDb(): Promise<MercadoPagoConfig> {
  const keys = Object.values(SETTING_KEYS.mercadoPago);
  const values = await getSettings(keys);
  return {
    publicKey: values[SETTING_KEYS.mercadoPago.publicKey] ?? "",
    accessToken: values[SETTING_KEYS.mercadoPago.accessToken] ?? "",
    webhookSecret: values[SETTING_KEYS.mercadoPago.webhookSecret] ?? "",
  };
}

export async function getMercadoPagoPublicKeyFromDb(): Promise<string | null> {
  const { publicKey } = await getMercadoPagoSettingsFromDb();
  return publicKey || null;
}
