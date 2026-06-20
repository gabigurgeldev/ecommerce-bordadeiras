"use server";

import { resolveWhatsappConnectionStatus } from "@/lib/whatsapp-client";
import { getWhatsappTemplate } from "@/actions/admin/whatsapp-templates";
import type { AdminCustomerInsights } from "@/lib/data/admin-customer-insights";
import { getAdminCustomerInsights } from "@/lib/data/admin-customer-insights";
import { getOpenRouterConfig } from "@/lib/openrouter-config";
import { callOpenRouterPrompt, OpenRouterError } from "@/lib/openrouter/client";
import {
  buildCustomerContextBlock,
  buildCustomerOutreachPrompt,
} from "@/lib/openrouter/prompts";
import { siteConfig } from "@/lib/site";
import {
  customerOutreachAiInputSchema,
  customerOutreachAiOutputSchema,
} from "@/lib/validations/customer-outreach";
import {
  canUseWhatsappOutreach,
  describeWhatsappOutreachRequirement,
  getUserNotificationPrefs,
  maskPhoneForAudit,
  resolveOutreachPurpose,
  type NotificationPrefs,
} from "@/lib/privacy/consent";
import {
  buildWhatsAppDeepLink,
  formatCurrencyBRL,
  formatTemplateText,
  normalizeBrazilPhone,
} from "@/lib/whatsapp-utils";
import {
  sendCustomerMessage,
  sendCustomerRawMessage,
} from "@/lib/whatsapp-client";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { auditMutation, withAdmin, withAdminRead, type ActionResult } from "./_utils";

const NOT_CONFIGURED =
  "Configure a API do OpenRouter em Configurações → Inteligência Artificial";

const outreachSchema = z.object({
  userId: z.string().min(1),
  mode: z.enum(["template", "custom", "link_only"]),
  phone: z.string().optional(),
  templateKey: z.string().optional(),
  variables: z.record(z.union([z.string(), z.number()])).optional(),
  customText: z.string().optional(),
});

export type OutreachResult =
  | {
      success: true;
      sent: boolean;
      waLink?: string | null;
      previewText?: string;
      notice?: string;
    }
  | {
      success: false;
      error: string;
      waLink?: string | null;
      previewText?: string;
      sent?: false;
    };

function buildDefaultVariables(
  insights: NonNullable<Awaited<ReturnType<typeof getAdminCustomerInsights>>>,
  templateKey?: string,
): Record<string, string | number> {
  const customerName =
    insights.profile.name?.trim() || insights.profile.email.split("@")[0];
  const pending = insights.opportunities.pendingPaymentOrders[0];
  const cartLines = insights.opportunities.activeCart;
  const siteUrl = siteConfig.url.replace(/\/$/, "");

  const cartSummary = cartLines
    .map((l) => `• ${l.name} × ${l.quantity}`)
    .join("\n");

  const base: Record<string, string | number> = {
    customerName,
    storeName: siteConfig.name,
    cartSummary: cartSummary || "—",
    cartTotal: formatCurrencyBRL(insights.opportunities.cartSubtotalCents),
    message: "",
  };

  if (templateKey === "outreach_abandoned_cart") {
    return {
      ...base,
      checkoutUrl: siteUrl,
    };
  }

  if (templateKey === "outreach_pending_payment") {
    return {
      ...base,
      orderId: pending ? pending.id.slice(-8).toUpperCase() : "",
      amount: pending ? formatCurrencyBRL(pending.totalCents) : "",
      amountCents: pending?.totalCents ?? 0,
      checkoutUrl: pending ? `${siteUrl}/checkout?order=${pending.id}` : siteUrl,
    };
  }

  if (templateKey === "outreach_generic") {
    return base;
  }

  return {
    ...base,
    orderId: pending ? pending.id.slice(-8).toUpperCase() : "",
    amount: pending ? formatCurrencyBRL(pending.totalCents) : "",
    amountCents: pending?.totalCents ?? 0,
    checkoutUrl: pending ? `${siteUrl}/checkout?order=${pending.id}` : siteUrl,
  };
}

export async function sendCustomerOutreach(
  input: unknown,
): Promise<OutreachResult> {
  try {
    const actor = await requireAdmin();
    const parsed = outreachSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const insights = await getAdminCustomerInsights(parsed.data.userId);
    if (!insights) return { success: false, error: "Cliente não encontrado" };

    const outreachPurpose = resolveOutreachPurpose(parsed.data.templateKey);
    const prefs = await getUserNotificationPrefs(parsed.data.userId);
    if (!canUseWhatsappOutreach(prefs, outreachPurpose)) {
      return {
        success: false,
        error: describeWhatsappOutreachRequirement(outreachPurpose),
      };
    }

    const phoneRaw =
      parsed.data.phone?.trim() || insights.resolvedPhone || "";
    const phone = normalizeBrazilPhone(phoneRaw);
    if (!phone) {
      return {
        success: false,
        error: "Telefone do cliente não cadastrado. Informe um número válido.",
      };
    }

    const defaults = buildDefaultVariables(insights, parsed.data.templateKey);
    const variables = { ...defaults, ...parsed.data.variables };
    if (parsed.data.customText?.trim()) {
      variables.message = parsed.data.customText.trim();
    }

    if (parsed.data.mode === "link_only") {
      let previewText = parsed.data.customText?.trim() ?? "";
      if (!previewText && parsed.data.templateKey) {
        const tpl = await getWhatsappTemplate(parsed.data.templateKey);
        if (tpl) {
          previewText = formatTemplateText(tpl.template, variables);
        }
      }
      const waLink = buildWhatsAppDeepLink(phone, previewText);
      if (!waLink) {
        return { success: false, error: "Não foi possível gerar o link do WhatsApp" };
      }
      return { success: true, waLink, previewText, sent: false };
    }

    let messageText = "";
    if (parsed.data.mode === "custom") {
      messageText = parsed.data.customText?.trim() ?? "";
      if (!messageText) {
        return { success: false, error: "Digite a mensagem personalizada" };
      }
    } else {
      const templateKey = parsed.data.templateKey;
      if (!templateKey) {
        return { success: false, error: "Selecione um template" };
      }
      const tpl = await getWhatsappTemplate(templateKey);
      if (!tpl?.active) {
        return { success: false, error: "Template não encontrado ou inativo" };
      }
      messageText = formatTemplateText(tpl.template, variables);
    }

    const waLink = buildWhatsAppDeepLink(phone, messageText);
    const { status: whatsappStatus } = await resolveWhatsappConnectionStatus();

    if (whatsappStatus !== "connected") {
      return {
        success: true,
        sent: false,
        waLink,
        previewText: messageText,
        notice:
          "WhatsApp não conectado. Use o link para abrir a conversa no seu celular.",
      };
    }

    try {
      if (parsed.data.mode === "custom") {
        await sendCustomerRawMessage({ phone, text: messageText });
      } else {
        await sendCustomerMessage({
          phone,
          templateKey: parsed.data.templateKey!,
          variables,
        });
      }

      await auditMutation(actor, {
        action: "UPDATE",
        entity: "User",
        entityId: parsed.data.userId,
        metadata: {
          outreach: true,
          mode: parsed.data.mode,
          templateKey: parsed.data.templateKey ?? null,
          purpose: outreachPurpose,
          phoneMasked: maskPhoneForAudit(phone),
        },
      });

      return { success: true, sent: true, previewText: messageText, waLink };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha ao enviar";
      return {
        success: false,
        error: msg,
        waLink,
        previewText: messageText,
        sent: false,
      };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido";
    return { success: false, error: message };
  }
}

export async function getOutreachPreview(
  userId: string,
  templateKey: string,
  extraVariables?: Record<string, string | number>,
): Promise<{ preview: string; variables: Record<string, string | number> } | null> {
  return withAdminRead(async () => {
    const insights = await getAdminCustomerInsights(userId);
    if (!insights) return null;
    const prefs = await getUserNotificationPrefs(userId);
    const purpose = resolveOutreachPurpose(templateKey);
    if (!canUseWhatsappOutreach(prefs, purpose)) return null;
    const tpl = await getWhatsappTemplate(templateKey);
    if (!tpl) return null;
    const variables = {
      ...buildDefaultVariables(insights, templateKey),
      ...extraVariables,
    };
    return {
      preview: formatTemplateText(tpl.template, variables),
      variables,
    };
  });
}

function firstNameOnly(name: string | null, email: string): string {
  const source = name?.trim() || email.split("@")[0] || "cliente";
  return source.split(/\s+/)[0]?.slice(0, 40) || "cliente";
}

function buildCustomerContextForAi(
  insights: AdminCustomerInsights,
  prefs: NotificationPrefs,
): string {
  const customerName = firstNameOnly(insights.profile.name, insights.profile.email);

  let opportunityDetails = "";
  const pending = insights.opportunities.pendingPaymentOrders[0];
  if (pending) {
    const items = pending.items
      .slice(0, 3)
      .map((i) => `${i.name} × ${i.quantity}`)
      .join(", ");
    opportunityDetails = [
      "Pedidos pendentes de pagamento:",
      `- Valor pendente: ${formatCurrencyBRL(pending.totalCents)}`,
      `  Itens: ${items}`,
    ].join("\n");
  } else if (insights.opportunities.activeCart.length > 0) {
    const lines = insights.opportunities.activeCart
      .slice(0, 3)
      .map((l) => `- ${l.name} × ${l.quantity} (${formatCurrencyBRL(l.priceCents * l.quantity)})`)
      .join("\n");
    opportunityDetails = [
      "Sacola ativa:",
      lines,
      `Total da sacola: ${formatCurrencyBRL(insights.opportunities.cartSubtotalCents)}`,
    ].join("\n");
  } else {
    opportunityDetails = "Sem pedido pendente nem sacola ativa.";
  }

  const statsSummary = [
    "Histórico de compras:",
    `- Pedidos totais: ${insights.stats.totalOrders}`,
    `- Pedidos pagos: ${insights.stats.paidOrders}`,
    insights.stats.avgOrderCents > 0
      ? `- Ticket médio: ${formatCurrencyBRL(insights.stats.avgOrderCents)}`
      : null,
    insights.stats.daysSinceLastOrder != null
      ? `- Dias desde última compra: ${insights.stats.daysSinceLastOrder}`
      : "- Nunca comprou",
  ]
    .filter(Boolean)
    .join("\n");

  const topProducts =
    insights.interests.topProducts.length > 0
      ? [
          "Produtos de interesse:",
          ...insights.interests.topProducts
            .slice(0, 3)
            .map((p) => `- ${p.name} (${p.source === "cart" ? "na sacola" : "comprou"})`),
        ].join("\n")
      : "";

  const recentViews =
    prefs.behavioralAnalytics && insights.interests.recentProductViews.length > 0
      ? [
          "Visualizações recentes consentidas:",
          ...insights.interests.recentProductViews
            .slice(0, 3)
            .map((v) => `- ${v.productName}`),
        ].join("\n")
      : "";

  const recentActivity = prefs.behavioralAnalytics
    ? `Sinais comportamentais consentidos: ${insights.activity.length} eventos recentes resumidos.`
    : "";

  return buildCustomerContextBlock({
    storeName: siteConfig.name,
    customerName,
    primaryOpportunity: insights.opportunities.primaryOpportunity,
    opportunityDetails,
    statsSummary,
    topProducts,
    recentViews,
    recentActivity,
  });
}

export async function generateCustomerOutreachMessage(
  input: unknown,
): Promise<ActionResult<{ message: string }>> {
  return withAdmin(async (actor) => {
    const parsed = customerOutreachAiInputSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
      return { success: false, error: msg };
    }

    const insights = await getAdminCustomerInsights(parsed.data.userId);
    if (!insights) {
      return { success: false, error: "Cliente não encontrado" };
    }

    const prefs = await getUserNotificationPrefs(parsed.data.userId);
    const aiPurpose =
      insights.opportunities.primaryOpportunity === "pending_payment"
        ? "pending_payment"
        : insights.opportunities.primaryOpportunity === "abandoned_cart"
          ? "abandoned_cart"
          : "marketing";
    if (!canUseWhatsappOutreach(prefs, aiPurpose)) {
      return {
        success: false,
        error: describeWhatsappOutreachRequirement(aiPurpose),
      };
    }
    if (!prefs.aiPersonalization) {
      return {
        success: false,
        error: "Cliente não autorizou personalização com IA.",
      };
    }

    const config = await getOpenRouterConfig();
    if (!config) {
      return { success: false, error: NOT_CONFIGURED };
    }

    const customerContext = buildCustomerContextForAi(insights, prefs);
    const { system, user } = buildCustomerOutreachPrompt(
      parsed.data.mode,
      customerContext,
      parsed.data.guidance,
    );

    try {
      const raw = await callOpenRouterPrompt({
        apiKey: config.apiKey,
        model: config.model,
        system,
        user,
        maxTokens: 2048,
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      const outputParsed = customerOutreachAiOutputSchema.safeParse(parsedJson);
      if (!outputParsed.success) {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      await auditMutation(actor, {
        action: "UPDATE",
        entity: "CustomerOutreachAi",
        entityId: parsed.data.userId,
        metadata: { mode: parsed.data.mode },
      });

      return { success: true, data: { message: outputParsed.data.message } };
    } catch (err) {
      if (err instanceof OpenRouterError) {
        return { success: false, error: err.message };
      }
      console.error("[generateCustomerOutreachMessage]", err);
      return { success: false, error: "Falha ao comunicar com a IA" };
    }
  });
}
