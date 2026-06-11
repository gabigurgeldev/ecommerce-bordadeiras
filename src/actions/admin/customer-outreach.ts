"use server";

import { getWhatsappStatus } from "@/actions/admin/settings";
import { getWhatsappTemplate } from "@/actions/admin/whatsapp-templates";
import { getAdminCustomerInsights } from "@/lib/data/admin-customer-insights";
import { siteConfig } from "@/lib/site";
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
import { auditMutation, withAdminRead } from "./_utils";

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
): Record<string, string | number> {
  const customerName =
    insights.profile.name?.trim() || insights.profile.email.split("@")[0];
  const pending = insights.opportunities.pendingPaymentOrders[0];
  const cartLines = insights.opportunities.activeCart;

  const cartSummary = cartLines
    .map((l) => `• ${l.name} × ${l.quantity}`)
    .join("\n");
  const siteUrl = siteConfig.url.replace(/\/$/, "");

  return {
    customerName,
    storeName: siteConfig.name,
    orderId: pending ? pending.id.slice(-8).toUpperCase() : "",
    amount: pending ? formatCurrencyBRL(pending.totalCents) : "",
    amountCents: pending?.totalCents ?? 0,
    checkoutUrl: pending ? `${siteUrl}/checkout?order=${pending.id}` : siteUrl,
    cartSummary: cartSummary || "—",
    cartTotal: formatCurrencyBRL(insights.opportunities.cartSubtotalCents),
    message: "",
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

    const phoneRaw =
      parsed.data.phone?.trim() || insights.resolvedPhone || "";
    const phone = normalizeBrazilPhone(phoneRaw);
    if (!phone) {
      return {
        success: false,
        error: "Telefone do cliente não cadastrado. Informe um número válido.",
      };
    }

    const defaults = buildDefaultVariables(insights);
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
    const { status: whatsappStatus } = await getWhatsappStatus();

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
          phone,
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
    const tpl = await getWhatsappTemplate(templateKey);
    if (!tpl) return null;
    const variables = { ...buildDefaultVariables(insights), ...extraVariables };
    return {
      preview: formatTemplateText(tpl.template, variables),
      variables,
    };
  });
}
