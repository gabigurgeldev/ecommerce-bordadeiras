/** Keys stored in the Setting model (key-value store). */
export const SETTING_KEYS = {
  mercadoPago: {
    publicKey: "mercadopago.public_key",
    accessToken: "mercadopago.access_token",
    webhookSecret: "mercadopago.webhook_secret",
  },
  smtp: {
    host: "smtp.host",
    port: "smtp.port",
    user: "smtp.user",
    password: "smtp.password",
    from: "smtp.from",
  },
  storefrontUtility: {
    message: "storefront.utility.message",
    bg: "storefront.utility.bg",
    text: "storefront.utility.text",
    link: "storefront.utility.link",
  },
} as const;

export type SettingKey =
  | (typeof SETTING_KEYS.mercadoPago)[keyof typeof SETTING_KEYS.mercadoPago]
  | (typeof SETTING_KEYS.smtp)[keyof typeof SETTING_KEYS.smtp]
  | (typeof SETTING_KEYS.storefrontUtility)[keyof typeof SETTING_KEYS.storefrontUtility];
