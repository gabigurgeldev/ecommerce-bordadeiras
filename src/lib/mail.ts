import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { getMailSettings } from "@/lib/settings";
import { cadastroTemplate } from "@/lib/mail/templates/cadastro";
import { recuperacaoSenhaTemplate } from "@/lib/mail/templates/recuperacao-senha";
import { pedidoConfirmadoTemplate } from "@/lib/mail/templates/pedido-confirmado";
import { pedidoEnviadoTemplate } from "@/lib/mail/templates/pedido-enviado";
import { pedidoEntregueTemplate } from "@/lib/mail/templates/pedido-entregue";
import { rastreamentoTemplate } from "@/lib/mail/templates/rastreamento";

let transporter: Transporter | null = null;
let transporterKey = "";

async function getTransporter(): Promise<Transporter> {
  const cfg = await getMailSettings();
  const key = `${cfg.host}:${cfg.port}:${cfg.user}`;
  if (transporter && transporterKey === key) return transporter;

  transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
  });
  transporterKey = key;
  return transporter;
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const cfg = await getMailSettings();
  const transport = await getTransporter();
  await transport.sendMail({
    from: cfg.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export async function sendRegistrationEmail(params: { to: string; name: string }) {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/login`;
  await sendMail({
    to: params.to,
    subject: "Bem-vindo à Bordadeiras",
    html: cadastroTemplate({ name: params.name, loginUrl }),
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
