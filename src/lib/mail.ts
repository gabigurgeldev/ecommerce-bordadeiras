import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  getMailSettings,
  isMailConfigured,
  resolveSmtpSecure,
  type MailSettings,
} from "@/lib/settings";
import { cadastroTemplate } from "@/lib/mail/templates/cadastro";
import { verificacaoEmailTemplate } from "@/lib/mail/templates/verificacao-email";
import { recuperacaoSenhaTemplate } from "@/lib/mail/templates/recuperacao-senha";
import { pedidoConfirmadoTemplate } from "@/lib/mail/templates/pedido-confirmado";
import { pedidoEnviadoTemplate } from "@/lib/mail/templates/pedido-enviado";
import { pedidoEntregueTemplate } from "@/lib/mail/templates/pedido-entregue";
import { rastreamentoTemplate } from "@/lib/mail/templates/rastreamento";

export class MailNotConfiguredError extends Error {
  constructor() {
    super(
      "SMTP não configurado. Defina SMTP_* no ambiente ou salve em Admin → Configurações → SMTP.",
    );
    this.name = "MailNotConfiguredError";
  }
}

export function formatMailError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const e = err as Error & { code?: string; responseCode?: number };
  return [e.code, e.message, e.responseCode != null ? `code ${e.responseCode}` : ""]
    .filter(Boolean)
    .join(" — ");
}

export function buildTransportOptions(cfg: MailSettings) {
  const secure = resolveSmtpSecure(cfg.port, cfg.secure);
  return {
    host: cfg.host,
    port: cfg.port,
    secure,
    ...(cfg.port === 587 && !secure ? { requireTLS: true } : {}),
    auth: { user: cfg.user, pass: cfg.pass },
  };
}

let transporter: Transporter | null = null;
let transporterKey = "";

async function getTransporter(): Promise<Transporter> {
  const cfg = await getMailSettings();
  if (!isMailConfigured(cfg)) throw new MailNotConfiguredError();

  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport(buildTransportOptions(cfg));
  transporterKey = key;
  return transporter;
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const cfg = await getMailSettings();
  if (!isMailConfigured(cfg)) {
    console.error("[mail] SMTP not configured", { host: cfg.host || "(empty)", port: cfg.port });
    throw new MailNotConfiguredError();
  }

  const from = cfg.from || cfg.user;
  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (err) {
    console.error("[mail] send failed", {
      to: options.to,
      subject: options.subject,
      host: cfg.host,
      port: cfg.port,
      error: formatMailError(err),
    });
    throw err;
  }
}

/** Used by Admin → SMTP test; shares the same transport as transactional mail. */
export async function sendTestEmail(params: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const cfg = await getMailSettings();
  if (!isMailConfigured(cfg)) throw new MailNotConfiguredError();

  const transport = await getTransporter();
  const from = cfg.from || cfg.user;
  try {
    await transport.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      text: params.text,
    });
  } catch (err) {
    console.error("[mail] test send failed", {
      to: params.to,
      host: cfg.host,
      port: cfg.port,
      error: formatMailError(err),
    });
    throw err;
  }
}

export async function sendRegistrationEmail(params: { to: string; name: string }) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
  await sendMail({
    to: params.to,
    subject: "Bem-vindo à Bordadeiras",
    html: cadastroTemplate({ name: params.name, loginUrl }),
  });
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  code: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verificar-email?email=${encodeURIComponent(params.to)}`;
  await sendMail({
    to: params.to,
    subject: "Código de verificação — Bordadeiras",
    html: verificacaoEmailTemplate({
      name: params.name,
      code: params.code,
      verifyUrl,
    }),
    text: `Seu código de verificação Bordadeiras: ${params.code}. Válido por 15 minutos.`,
  });
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  await sendMail({
    to: params.to,
    subject: "Recuperação de senha — Bordadeiras",
    html: recuperacaoSenhaTemplate(params),
  });
}

export async function sendOrderConfirmedEmail(params: {
  to: string;
  orderId: string;
  customerName: string;
  totalCents: number;
  items: { name: string; quantity: number; priceCents: number }[];
}) {
  await sendMail({
    to: params.to,
    subject: `Pedido confirmado #${params.orderId.slice(-8)}`,
    html: pedidoConfirmadoTemplate(params),
  });
}

export async function sendOrderShippedEmail(params: {
  to: string;
  orderId: string;
  customerName: string;
  trackingCode?: string | null;
}) {
  await sendMail({
    to: params.to,
    subject: `Pedido enviado #${params.orderId.slice(-8)}`,
    html: pedidoEnviadoTemplate(params),
  });
}

export async function sendOrderDeliveredEmail(params: {
  to: string;
  orderId: string;
  customerName: string;
}) {
  await sendMail({
    to: params.to,
    subject: `Pedido entregue #${params.orderId.slice(-8)}`,
    html: pedidoEntregueTemplate(params),
  });
}

export async function sendTrackingEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  trackingCode: string;
  trackingUrl?: string;
}) {
  await sendMail({
    to: params.to,
    subject: `Rastreamento — pedido #${params.orderId.slice(-8)}`,
    html: rastreamentoTemplate(params),
  });
}
