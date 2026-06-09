/**
 * Centralized read/write layer for all Mercado Pago + checkout payment settings.
 * Performs a single DB round-trip and exposes typed defaults.
 */
import { probeMpAccessTokenEnv } from "@/lib/mercadopago-credentials";
import { getSettings, setSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type MpEnabledMethods = {
  pix: boolean;
  credit_card: boolean;
  debit_card: boolean;
  boleto: boolean;
};

export type PaymentSettings = {
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  sandbox: boolean;
  enabledMethods: MpEnabledMethods;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  checkoutTitle: string;
  checkoutSubtitle: string;
  showTrustBadges: boolean;
};

export const PAYMENT_SETTINGS_DEFAULTS: PaymentSettings = {
  publicKey: "",
  accessToken: "",
  webhookSecret: "",
  sandbox: false,
  enabledMethods: {
    pix: true,
    credit_card: true,
    debit_card: true,
    boleto: true,
  },
  maxInstallments: 12,
  installmentFees: "buyer",
  checkoutTitle: "Finalizar compra",
  checkoutSubtitle: "Revise seu pedido e escolha a forma de pagamento",
  showTrustBadges: true,
};

/** Chaves legadas do sistema antigo (pares separados teste/produção). */
const LEGACY_MP_KEYS = {
  sandboxPublicKey: "mercadopago.sandbox_public_key",
  sandboxAccessToken: "mercadopago.sandbox_access_token",
} as const;

function parseEnabledMethods(raw: string | undefined): MpEnabledMethods {
  const d = PAYMENT_SETTINGS_DEFAULTS.enabledMethods;
  if (!raw) return { ...d };
  try {
    const p = JSON.parse(raw) as Partial<MpEnabledMethods>;
    return {
      pix: p.pix ?? d.pix,
      credit_card: p.credit_card ?? d.credit_card,
      debit_card: p.debit_card ?? d.debit_card,
      boleto: p.boleto ?? d.boleto,
    };
  } catch {
    return { ...d };
  }
}

const ALL_PAYMENT_KEYS = [
  ...Object.values(SETTING_KEYS.mercadoPago),
  ...Object.values(SETTING_KEYS.checkout),
  ...Object.values(LEGACY_MP_KEYS),
] as const;

/**
 * Resolve credenciais ativas. Se sandbox estiver ligado e o token salvo for de
 * produção, usa credenciais legadas de teste (migração automática).
 */
async function resolveActiveCredentials(params: {
  sandbox: boolean;
  publicKey: string;
  accessToken: string;
  legacySandboxPublicKey: string;
  legacySandboxAccessToken: string;
}): Promise<{ publicKey: string; accessToken: string; migrated: boolean }> {
  const { sandbox, legacySandboxPublicKey, legacySandboxAccessToken } = params;
  let { publicKey, accessToken } = params;

  if (!sandbox) {
    return { publicKey, accessToken, migrated: false };
  }

  const legacyReady =
    legacySandboxPublicKey.length > 0 && legacySandboxAccessToken.length > 0;

  if (!accessToken) {
    if (legacyReady) {
      return {
        publicKey: legacySandboxPublicKey,
        accessToken: legacySandboxAccessToken,
        migrated: true,
      };
    }
    return { publicKey, accessToken, migrated: false };
  }

  const probe = await probeMpAccessTokenEnv(accessToken);
  if (probe.env === "production" && legacyReady) {
    return {
      publicKey: legacySandboxPublicKey,
      accessToken: legacySandboxAccessToken,
      migrated: true,
    };
  }

  return { publicKey, accessToken, migrated: false };
}

/** Reads all MP + checkout settings in a single DB query. */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const v = await getSettings([...ALL_PAYMENT_KEYS]);
  const fees = v[SETTING_KEYS.mercadoPago.installmentFees];
  const sandbox = v[SETTING_KEYS.mercadoPago.sandbox] === "true";

  const resolved = await resolveActiveCredentials({
    sandbox,
    publicKey: (v[SETTING_KEYS.mercadoPago.publicKey] || "").trim(),
    accessToken: (v[SETTING_KEYS.mercadoPago.accessToken] || "").trim(),
    legacySandboxPublicKey: (v[LEGACY_MP_KEYS.sandboxPublicKey] || "").trim(),
    legacySandboxAccessToken: (v[LEGACY_MP_KEYS.sandboxAccessToken] || "").trim(),
  });

  // Persiste migração automática para credenciais de teste legadas
  if (resolved.migrated) {
    await setSettings({
      [SETTING_KEYS.mercadoPago.publicKey]: resolved.publicKey,
      [SETTING_KEYS.mercadoPago.accessToken]: resolved.accessToken,
    });
  }

  return {
    publicKey: resolved.publicKey,
    accessToken: resolved.accessToken,
    webhookSecret: (v[SETTING_KEYS.mercadoPago.webhookSecret] || "").trim(),
    sandbox,
    enabledMethods: parseEnabledMethods(v[SETTING_KEYS.mercadoPago.enabledMethods]),
    maxInstallments: Math.min(
      12,
      Math.max(
        1,
        Number(v[SETTING_KEYS.mercadoPago.maxInstallments]) ||
          PAYMENT_SETTINGS_DEFAULTS.maxInstallments,
      ),
    ),
    installmentFees: fees === "merchant" ? "merchant" : "buyer",
    checkoutTitle:
      v[SETTING_KEYS.checkout.title]?.trim() || PAYMENT_SETTINGS_DEFAULTS.checkoutTitle,
    checkoutSubtitle:
      v[SETTING_KEYS.checkout.subtitle]?.trim() || PAYMENT_SETTINGS_DEFAULTS.checkoutSubtitle,
    showTrustBadges: v[SETTING_KEYS.checkout.showTrustBadges] !== "false",
  };
}

/** Writes payment settings to DB. */
export async function savePaymentSettings(
  data: Partial<
    Omit<PaymentSettings, "enabledMethods"> & { enabledMethods: Partial<MpEnabledMethods> }
  >,
  base: PaymentSettings = PAYMENT_SETTINGS_DEFAULTS,
): Promise<void> {
  const methods: MpEnabledMethods = { ...base.enabledMethods, ...data.enabledMethods };

  const publicKey = data.publicKey !== undefined ? data.publicKey.trim() : base.publicKey;
  const accessToken =
    data.accessToken !== undefined ? data.accessToken.trim() : base.accessToken;

  const entries: Record<string, string> = {
    [SETTING_KEYS.mercadoPago.publicKey]: publicKey,
    [SETTING_KEYS.mercadoPago.accessToken]: accessToken,
    [SETTING_KEYS.mercadoPago.webhookSecret]: data.webhookSecret ?? base.webhookSecret,
    [SETTING_KEYS.mercadoPago.sandbox]: String(data.sandbox ?? base.sandbox),
    [SETTING_KEYS.mercadoPago.enabledMethods]: JSON.stringify(methods),
    [SETTING_KEYS.mercadoPago.maxInstallments]: String(
      data.maxInstallments ?? base.maxInstallments,
    ),
    [SETTING_KEYS.mercadoPago.installmentFees]: data.installmentFees ?? base.installmentFees,
    [SETTING_KEYS.checkout.title]: data.checkoutTitle ?? base.checkoutTitle,
    [SETTING_KEYS.checkout.subtitle]: data.checkoutSubtitle ?? base.checkoutSubtitle,
    [SETTING_KEYS.checkout.showTrustBadges]: String(data.showTrustBadges ?? base.showTrustBadges),
  };

  await setSettings(entries);
}
