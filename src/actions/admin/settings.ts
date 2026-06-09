"use server";

import {
  validateMpCredentialPair,
  verifyAccessTokenMatchesSandbox,
} from "@/lib/mercadopago-credentials";
import { getStorefrontUtilitySettings } from "@/lib/data/storefront-settings";
import {
  getShippingSettings as loadShippingSettings,
  saveShippingSettings as persistShippingSettings,
} from "@/lib/data/shipping-settings";
import {
  getActiveMelhorEnvioEnvironment,
  getMelhorEnvioSettings,
  isMelhorEnvioConnected,
  saveMelhorEnvioCredentials,
} from "@/lib/data/melhor-envio-settings";
import { disconnectMelhorEnvio } from "@/lib/melhor-envio/auth";
import { getMelhorEnvioRedirectUri } from "@/lib/melhor-envio/config";
import {
  getPaymentSettings,
  savePaymentSettings,
  PAYMENT_SETTINGS_DEFAULTS,
} from "@/lib/data/payment-settings";
import {
  fetchMultiplePaymentMethodRates,
  type PaymentMethodId,
} from "@/lib/mercadopago-installments";
import { getSettings, setSettings, getMailSettings } from "@/lib/settings";
import { formatMailError, MailNotConfiguredError, sendTestEmail } from "@/lib/mail";
import { SETTING_KEYS } from "@/lib/settings-keys";
import {
  mercadoPagoSettingsSchema,
  openRouterSettingsSchema,
  melhorEnvioSettingsFormSchema,
  shippingSettingsFormSchema,
  smtpSettingsSchema,
  storefrontUtilitySettingsSchema,
  DEFAULT_OPENROUTER_MODEL,
} from "@/lib/validations/admin";
import { revalidatePath } from "next/cache";
import { getDb, TABLES } from "@/lib/supabase/db";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function getMercadoPagoSettings() {
  return withAdminRead(async () => {
    const [ps, themeValues] = await Promise.all([
      getPaymentSettings(),
      getSettings([SETTING_KEYS.checkout.theme]),
    ]);
    const themeRaw = themeValues[SETTING_KEYS.checkout.theme];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let checkoutTheme: Record<string, any> | undefined;
    if (themeRaw) {
      try { checkoutTheme = JSON.parse(themeRaw) as Record<string, unknown>; } catch { /* use form defaults */ }
    }

    const credentialCheck = validateMpCredentialPair({
      publicKey: ps.publicKey,
      accessToken: ps.accessToken,
    });

    let credentialsError: string | null = credentialCheck.valid
      ? null
      : credentialCheck.message;

    if (credentialCheck.valid) {
      const envCheck = await verifyAccessTokenMatchesSandbox(
        ps.accessToken,
        ps.sandbox,
      );
      if (!envCheck.ok) credentialsError = envCheck.message;
    }

    return {
      publicKey: ps.publicKey,
      accessToken: "",
      webhookSecret: "",
      hasAccessToken: ps.accessToken.length > 0,
      hasPublicKey: ps.publicKey.length > 0,
      hasWebhookSecret: ps.webhookSecret.length > 0,
      sandbox: ps.sandbox,
      credentialsValid: !credentialsError,
      credentialsError,
      enabledMethods: ps.enabledMethods,
      maxInstallments: ps.maxInstallments,
      installmentFees: ps.installmentFees,
      checkoutTitle: ps.checkoutTitle,
      checkoutSubtitle: ps.checkoutSubtitle,
      showTrustBadges: ps.showTrustBadges,
      checkoutTheme,
    };
  });
}

export async function saveMercadoPagoSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = mercadoPagoSettingsSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const existing = await getPaymentSettings();

    const publicKey = parsed.data.publicKey.trim();
    const accessTokenInput = parsed.data.accessToken?.trim() ?? "";
    const sandbox = parsed.data.sandbox;
    const publicKeyChanged = publicKey !== existing.publicKey.trim();
    const accessTokenProvided = Boolean(accessTokenInput);

    if (publicKeyChanged && !accessTokenProvided) {
      return {
        success: false,
        error:
          "Ao alterar a Public Key, cole também o Access Token do mesmo par " +
          "(Teste ou Produção, conforme o modo sandbox).",
      };
    }

    const accessToken = accessTokenProvided ? accessTokenInput : existing.accessToken;

    if (publicKey) {
      const check = validateMpCredentialPair({ publicKey, accessToken });
      if (!check.valid) {
        return { success: false, error: check.message };
      }

      const envCheck = await verifyAccessTokenMatchesSandbox(accessToken, sandbox);
      if (!envCheck.ok) {
        return { success: false, error: envCheck.message };
      }
    } else if (sandbox !== existing.sandbox && existing.accessToken) {
      const envCheck = await verifyAccessTokenMatchesSandbox(
        existing.accessToken,
        sandbox,
      );
      if (!envCheck.ok) {
        return { success: false, error: envCheck.message };
      }
    }

    const webhookIncoming = parsed.data.webhookSecret?.trim();
    const webhookSecret =
      webhookIncoming !== undefined && webhookIncoming !== ""
        ? webhookIncoming
        : existing.webhookSecret;

    await savePaymentSettings(
      {
        publicKey,
        accessToken: accessTokenProvided ? accessTokenInput : undefined,
        webhookSecret,
        sandbox,
        enabledMethods: parsed.data.enabledMethods,
        maxInstallments: parsed.data.maxInstallments,
        installmentFees: parsed.data.installmentFees,
        checkoutTitle: parsed.data.checkoutTitle ?? PAYMENT_SETTINGS_DEFAULTS.checkoutTitle,
        checkoutSubtitle:
          parsed.data.checkoutSubtitle ?? PAYMENT_SETTINGS_DEFAULTS.checkoutSubtitle,
        showTrustBadges: parsed.data.showTrustBadges,
      },
      existing,
    );

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "MercadoPago" });
    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout");
    return { success: true };
  });
}

const DEFAULT_RATE_METHODS: PaymentMethodId[] = ["visa", "master", "elo"];

export async function fetchMercadoPagoInstallmentRatesForAdmin(
  amountCents = 100_000,
  methods: PaymentMethodId[] = DEFAULT_RATE_METHODS,
) {
  return withAdminRead(async () => {
    const { results, errors } = await fetchMultiplePaymentMethodRates(amountCents, methods);
    if (results.length === 0) {
      const firstError = errors[0];
      return {
        success: false as const,
        error: firstError
          ? `${firstError.paymentMethodId}: ${firstError.error}`
          : "Nenhuma taxa encontrada",
      };
    }
    return { success: true as const, results, errors };
  });
}

export async function getSmtpSettings() {
  return withAdminRead(async () => {
    const cfg = await getMailSettings();
    const values = await getSettings(Object.values(SETTING_KEYS.smtp));
    const hasDbPassword = Boolean(values[SETTING_KEYS.smtp.password]);
    return {
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: hasDbPassword ? cfg.pass : "",
      from: cfg.from || cfg.user,
    };
  });
}

export async function saveSmtpSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = smtpSettingsSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    await setSettings({
      [SETTING_KEYS.smtp.host]: parsed.data.host,
      [SETTING_KEYS.smtp.port]: String(parsed.data.port),
      [SETTING_KEYS.smtp.user]: parsed.data.user,
      [SETTING_KEYS.smtp.password]: parsed.data.password,
      [SETTING_KEYS.smtp.from]: parsed.data.from,
    });

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "SMTP" });
    revalidateAdmin(["/admin/configuracoes"]);
    return { success: true };
  });
}

export async function sendSmtpTest(toEmail: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    if (!toEmail?.includes("@")) {
      return { success: false, error: "E-mail de destino inválido" };
    }

    try {
      await sendTestEmail({
        to: toEmail,
        subject: "Teste SMTP — Bordadeiras Admin",
        text: "E-mail de teste enviado pelo painel administrativo.",
      });
    } catch (err) {
      if (err instanceof MailNotConfiguredError) {
        return { success: false, error: err.message };
      }
      console.error("[sendSmtpTest]", formatMailError(err));
      return {
        success: false,
        error: `Falha ao enviar teste: ${formatMailError(err)}`,
      };
    }

    await auditMutation(actor, {
      action: "SETTINGS_CHANGE",
      entity: "SMTP",
      metadata: { testSend: true, to: toEmail },
    });
    return { success: true };
  });
}

export async function getWhatsappStatus() {
  return withAdminRead(async () => {
    const { data: session } = await getDb()
      .from(TABLES.WhatsappSession)
      .select("status, updatedAt")
      .eq("sessionId", "default")
      .maybeSingle();
    return {
      status: session?.status ?? "disconnected",
      updatedAt: session?.updatedAt ?? null,
    };
  });
}

export async function getStorefrontUtilitySettingsForAdmin() {
  return withAdminRead(() => getStorefrontUtilitySettings());
}

export async function saveStorefrontUtilitySettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = storefrontUtilitySettingsSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    await setSettings({
      [SETTING_KEYS.storefrontUtility.message]: parsed.data.message,
      [SETTING_KEYS.storefrontUtility.bg]: parsed.data.backgroundColor,
      [SETTING_KEYS.storefrontUtility.text]: parsed.data.textColor,
      [SETTING_KEYS.storefrontUtility.link]: parsed.data.link ?? "",
    });

    await auditMutation(actor, {
      action: "SETTINGS_CHANGE",
      entity: "StorefrontUtility",
    });
    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/", "layout");
    return { success: true };
  });
}

export async function getOpenRouterSettings() {
  return withAdminRead(async () => {
    const values = await getSettings(Object.values(SETTING_KEYS.openRouter));
    const apiKey = values[SETTING_KEYS.openRouter.apiKey] ?? "";
    return {
      apiKey: "",
      defaultModel:
        values[SETTING_KEYS.openRouter.defaultModel]?.trim() || DEFAULT_OPENROUTER_MODEL,
      hasApiKey: apiKey.length > 0 || Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    };
  });
}

export async function saveOpenRouterSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = openRouterSettingsSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const existing = await getSettings(Object.values(SETTING_KEYS.openRouter));
    const apiKey =
      parsed.data.apiKey?.trim() ||
      existing[SETTING_KEYS.openRouter.apiKey] ||
      process.env.OPENROUTER_API_KEY?.trim() ||
      "";

    if (!apiKey) {
      return { success: false, error: "API Key é obrigatória na primeira configuração" };
    }

    const defaultModel = parsed.data.defaultModel?.trim() || DEFAULT_OPENROUTER_MODEL;

    await setSettings({
      [SETTING_KEYS.openRouter.apiKey]: apiKey,
      [SETTING_KEYS.openRouter.defaultModel]: defaultModel,
    });

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "OpenRouter" });
    revalidateAdmin(["/admin/configuracoes"]);
    return { success: true };
  });
}

function maskCepDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 8);
  if (clean.length > 5) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  return clean;
}

function reaisStringToCents(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

export async function getShippingSettings() {
  return withAdminRead(async () => {
    const settings = await loadShippingSettings();
    return {
      originCep: settings.originCep ? maskCepDisplay(settings.originCep) : "",
      originStreet: settings.originStreet,
      originNumber: settings.originNumber,
      originComplement: settings.originComplement,
      originNeighborhood: settings.originNeighborhood,
      originCity: settings.originCity,
      originState: settings.originState,
      freeThresholdReais:
        settings.freeShippingThresholdCents != null && settings.freeShippingThresholdCents > 0
          ? (settings.freeShippingThresholdCents / 100).toFixed(2)
          : "",
    };
  });
}

export async function saveShippingSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = shippingSettingsFormSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        Object.values(first).flat()[0] ??
        parsed.error.flatten().formErrors[0] ??
        "Dados inválidos";
      return { success: false, error: msg };
    }

    const cepDigits = parsed.data.originCep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      return { success: false, error: "CEP inválido (8 dígitos)" };
    }

    await persistShippingSettings({
      originCep: cepDigits,
      originStreet: parsed.data.originStreet.trim(),
      originNumber: parsed.data.originNumber.trim(),
      originComplement: parsed.data.originComplement?.trim() ?? "",
      originNeighborhood: parsed.data.originNeighborhood.trim(),
      originCity: parsed.data.originCity.trim(),
      originState: parsed.data.originState.trim().toUpperCase(),
      freeShippingThresholdCents: reaisStringToCents(parsed.data.freeThresholdReais),
    });

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "Shipping" });
    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout");
    return { success: true };
  });
}

export async function getMelhorEnvioSettingsForAdmin() {
  return withAdminRead(async () => {
    const settings = await getMelhorEnvioSettings();
    const activeConnected = isMelhorEnvioConnected(settings);

    return {
      useSandbox: settings.useSandbox,
      sandboxClientId: settings.sandbox.clientId,
      hasSandboxClientSecret: Boolean(settings.sandbox.clientSecret),
      productionClientId: settings.production.clientId,
      hasProductionClientSecret: Boolean(settings.production.clientSecret),
      sandboxConnected: Boolean(
        settings.sandbox.accessToken && settings.sandbox.refreshToken,
      ),
      productionConnected: Boolean(
        settings.production.accessToken && settings.production.refreshToken,
      ),
      activeConnected,
      redirectUri: getMelhorEnvioRedirectUri(),
    };
  });
}

export async function saveMelhorEnvioSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = melhorEnvioSettingsFormSchema.safeParse(data);
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        Object.values(first).flat()[0] ??
        parsed.error.flatten().formErrors[0] ??
        "Dados inválidos";
      return { success: false, error: msg };
    }

    const current = await getMelhorEnvioSettings();
    const sandboxSecret =
      parsed.data.sandboxClientSecret?.trim() || current.sandbox.clientSecret;
    const productionSecret =
      parsed.data.productionClientSecret?.trim() || current.production.clientSecret;

    await saveMelhorEnvioCredentials({
      useSandbox: parsed.data.useSandbox,
      sandboxClientId: parsed.data.sandboxClientId?.trim() ?? "",
      sandboxClientSecret: sandboxSecret,
      productionClientId: parsed.data.productionClientId?.trim() ?? "",
      productionClientSecret: productionSecret,
    });

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "MelhorEnvio" });
    revalidateAdmin(["/admin/configuracoes"]);
    revalidatePath("/checkout");
    return { success: true };
  });
}

export async function disconnectMelhorEnvioSettings(
  env?: "sandbox" | "production",
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await disconnectMelhorEnvio(env);
    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "MelhorEnvioDisconnect" });
    revalidateAdmin(["/admin/configuracoes"]);
    return { success: true };
  });
}

export async function probeMelhorEnvioApiAccessForAdmin(): Promise<
  ActionResult & { message?: string }
> {
  return withAdminRead(async () => {
    const settings = await getMelhorEnvioSettings();
    const env = getActiveMelhorEnvioEnvironment(settings);
    const { probeMelhorEnvioApiAccess } = await import("@/lib/melhor-envio/auth");
    const result = await probeMelhorEnvioApiAccess(env);
    if (result.ok) {
      return { success: true, message: result.message };
    }
    return { success: false, error: result.message };
  });
}
