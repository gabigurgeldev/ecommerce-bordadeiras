"use server";

import { getSettings, setSettings, getMailSettings } from "@/lib/settings";
import { formatMailError, MailNotConfiguredError, sendTestEmail } from "@/lib/mail";
import { SETTING_KEYS } from "@/lib/settings-keys";
import { mercadoPagoSettingsSchema, smtpSettingsSchema } from "@/lib/validations/admin";
import { prisma } from "@/lib/prisma";
import { auditMutation, revalidateAdmin, withAdmin, type ActionResult } from "./_utils";

export async function getMercadoPagoSettings() {
  const keys = Object.values(SETTING_KEYS.mercadoPago);
  const values = await getSettings(keys);
  const accessToken = values[SETTING_KEYS.mercadoPago.accessToken] ?? "";
  const webhookSecret = values[SETTING_KEYS.mercadoPago.webhookSecret] ?? "";
  return {
    publicKey: values[SETTING_KEYS.mercadoPago.publicKey] ?? "",
    accessToken: "",
    webhookSecret: "",
    hasAccessToken: accessToken.length > 0,
    hasWebhookSecret: webhookSecret.length > 0,
  };
}

export async function saveMercadoPagoSettings(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = mercadoPagoSettingsSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const existing = await getSettings(Object.values(SETTING_KEYS.mercadoPago));
    const accessToken =
      parsed.data.accessToken?.trim() ||
      existing[SETTING_KEYS.mercadoPago.accessToken] ||
      "";
    if (!accessToken) {
      return { success: false, error: "Access Token é obrigatório na primeira configuração" };
    }

    const webhookIncoming = parsed.data.webhookSecret?.trim();
    const webhookSecret =
      webhookIncoming !== undefined && webhookIncoming !== ""
        ? webhookIncoming
        : existing[SETTING_KEYS.mercadoPago.webhookSecret] ?? "";

    await setSettings({
      [SETTING_KEYS.mercadoPago.publicKey]: parsed.data.publicKey,
      [SETTING_KEYS.mercadoPago.accessToken]: accessToken,
      [SETTING_KEYS.mercadoPago.webhookSecret]: webhookSecret,
    });

    await auditMutation(actor, { action: "SETTINGS_CHANGE", entity: "MercadoPago" });
    revalidateAdmin(["/admin/configuracoes"]);
    return { success: true };
  });
}

export async function getSmtpSettings() {
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
  const session = await prisma.whatsappSession.findFirst({
    where: { sessionId: "default" },
  });
  return {
    status: session?.status ?? "disconnected",
    updatedAt: session?.updatedAt ?? null,
  };
}
