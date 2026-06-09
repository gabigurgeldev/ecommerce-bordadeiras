/** Keys stored in the Setting model (key-value store). */
export const SETTING_KEYS = {
  mercadoPago: {
    publicKey: "mercadopago.public_key",
    accessToken: "mercadopago.access_token",
    webhookSecret: "mercadopago.webhook_secret",
    sandbox: "mercadopago.sandbox",
    enabledMethods: "mercadopago.enabled_methods",
    maxInstallments: "mercadopago.max_installments",
    installmentFees: "mercadopago.installment_fees",
  },
  checkout: {
    title: "checkout.title",
    subtitle: "checkout.subtitle",
    showTrustBadges: "checkout.show_trust_badges",
    theme: "checkout.theme",
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
  openRouter: {
    apiKey: "openrouter.api_key",
    defaultModel: "openrouter.default_model",
  },
  shipping: {
    originCep: "shipping.originCep",
    originStreet: "shipping.originStreet",
    originNumber: "shipping.originNumber",
    originComplement: "shipping.originComplement",
    originNeighborhood: "shipping.originNeighborhood",
    originCity: "shipping.originCity",
    originState: "shipping.originState",
    freeShippingThresholdCents: "shipping.freeShippingThresholdCents",
  },
  melhorEnvio: {
    useSandbox: "melhorenvio.useSandbox",
    sandboxClientId: "melhorenvio.sandbox.clientId",
    sandboxClientSecret: "melhorenvio.sandbox.clientSecret",
    sandboxAccessToken: "melhorenvio.sandbox.accessToken",
    sandboxRefreshToken: "melhorenvio.sandbox.refreshToken",
    sandboxExpiresAt: "melhorenvio.sandbox.expiresAt",
    productionClientId: "melhorenvio.production.clientId",
    productionClientSecret: "melhorenvio.production.clientSecret",
    productionAccessToken: "melhorenvio.production.accessToken",
    productionRefreshToken: "melhorenvio.production.refreshToken",
    productionExpiresAt: "melhorenvio.production.expiresAt",
  },
} as const;

export type SettingKey =
  | (typeof SETTING_KEYS.mercadoPago)[keyof typeof SETTING_KEYS.mercadoPago]
  | (typeof SETTING_KEYS.smtp)[keyof typeof SETTING_KEYS.smtp]
  | (typeof SETTING_KEYS.storefrontUtility)[keyof typeof SETTING_KEYS.storefrontUtility]
  | (typeof SETTING_KEYS.openRouter)[keyof typeof SETTING_KEYS.openRouter]
  | (typeof SETTING_KEYS.checkout)[keyof typeof SETTING_KEYS.checkout]
  | (typeof SETTING_KEYS.shipping)[keyof typeof SETTING_KEYS.shipping]
  | (typeof SETTING_KEYS.melhorEnvio)[keyof typeof SETTING_KEYS.melhorEnvio];
