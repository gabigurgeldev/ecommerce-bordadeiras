import { getPaymentSettings } from "@/lib/data/payment-settings";
import { validateMpCredentialPair, verifyAccessTokenMatchesSandbox } from "@/lib/mercadopago-credentials";
import { getSettings } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/settings-keys";

export type MercadoPagoEnabledMethods = {
  pix: boolean;
  credit_card: boolean;
  debit_card: boolean;
  boleto: boolean;
};

export type MercadoPagoConfig = {
  publicKey: string;
  accessToken: string;
  webhookSecret: string;
  sandbox: boolean;
  enabledMethods: MercadoPagoEnabledMethods;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
};

export type CheckoutDisplayConfig = {
  title: string;
  subtitle: string;
  showTrustBadges: boolean;
};

/** Credenciais ativas do Mercado Pago. */
export async function getMercadoPagoSettingsFromDb(): Promise<MercadoPagoConfig> {
  const ps = await getPaymentSettings();
  return {
    publicKey: ps.publicKey,
    accessToken: ps.accessToken,
    webhookSecret: ps.webhookSecret,
    sandbox: ps.sandbox,
    enabledMethods: ps.enabledMethods,
    maxInstallments: ps.maxInstallments,
    installmentFees: ps.installmentFees,
  };
}

export async function getMercadoPagoPublicKeyFromDb(): Promise<string | null> {
  const { publicKey } = await getMercadoPagoSettingsFromDb();
  return publicKey || null;
}

export async function getCheckoutPaymentConfig(): Promise<{
  publicKey: string | null;
  sandbox: boolean;
  enabledMethods: MercadoPagoEnabledMethods;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  display: CheckoutDisplayConfig;
  credentialError: string | null;
}> {
  const mp = await getMercadoPagoSettingsFromDb();
  
  let credentialError: string | null = null;
  const check = validateMpCredentialPair({
    publicKey: mp.publicKey,
    accessToken: mp.accessToken,
  });
  if (!check.valid) {
    credentialError = check.message;
  } else {
    const envCheck = await verifyAccessTokenMatchesSandbox(mp.accessToken, mp.sandbox);
    if (!envCheck.ok) credentialError = envCheck.message;
  }

  const displayValues = await getSettings(Object.values(SETTING_KEYS.checkout));
  return {
    publicKey: mp.publicKey || null,
    sandbox: mp.sandbox,
    enabledMethods: mp.enabledMethods,
    maxInstallments: mp.maxInstallments,
    installmentFees: mp.installmentFees,
    credentialError,
    display: {
      title:
        displayValues[SETTING_KEYS.checkout.title]?.trim() ||
        "Finalizar compra",
      subtitle:
        displayValues[SETTING_KEYS.checkout.subtitle]?.trim() ||
        "Revise seu pedido e escolha a forma de pagamento",
      showTrustBadges:
        displayValues[SETTING_KEYS.checkout.showTrustBadges] !== "false",
    },
  };
}
