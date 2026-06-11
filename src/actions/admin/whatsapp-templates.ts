"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { whatsappTemplateSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";
import type { WhatsappTemplate } from "@/lib/types/database";

export async function listWhatsappTemplates() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .select("*")
      .order("event", { ascending: true })
      .order("recipientType", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function getWhatsappTemplate(key: string): Promise<WhatsappTemplate | null> {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error) throw error;
    return data as WhatsappTemplate | null;
  });
}

export async function createWhatsappTemplate(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappTemplateSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    const id = newId();
    const now = new Date().toISOString();
    const { error } = await getDb().from(TABLES.WhatsappTemplate).insert({
      id,
      key: parsed.data.key,
      name: parsed.data.name,
      template: parsed.data.template,
      recipientType: parsed.data.recipientType,
      event: parsed.data.event,
      active: parsed.data.active ?? true,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });
    if (error) {
      if (error.message.includes("unique")) {
        return { success: false, error: "Já existe um template com esta chave" };
      }
      return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: "CREATE",
      entity: "WhatsappTemplate",
      entityId: id,
    });
    revalidateAdmin(["/admin/whatsapp", "/admin/whatsapp/templates"]);
    return { success: true };
  });
}

export async function updateWhatsappTemplate(
  key: string,
  data: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = whatsappTemplateSchema.partial().safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };

    // Get existing template to check if it's default
    const existing = await getDb()
      .from(TABLES.WhatsappTemplate)
      .select("isDefault")
      .eq("key", key)
      .maybeSingle();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (!existing?.data?.isDefault) {
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
      if (parsed.data.template !== undefined) updateData.template = parsed.data.template;
      if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
      if (parsed.data.event !== undefined) updateData.event = parsed.data.event;
      if (parsed.data.recipientType !== undefined) {
        updateData.recipientType = parsed.data.recipientType;
      }
    } else {
      // For default templates, only allow editing template content and active status
      if (parsed.data.template !== undefined) updateData.template = parsed.data.template;
      if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    }

    const { error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .update(updateData)
      .eq("key", key);
    if (error) return { success: false, error: error.message };

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "WhatsappTemplate",
      entityId: key,
    });
    revalidateAdmin(["/admin/whatsapp", "/admin/whatsapp/templates"]);
    return { success: true };
  });
}

export async function deleteWhatsappTemplate(key: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    // Don't allow deleting default templates
    const existing = await getDb()
      .from(TABLES.WhatsappTemplate)
      .select("isDefault")
      .eq("key", key)
      .maybeSingle();

    if (existing?.data?.isDefault) {
      return { success: false, error: "Não é possível excluir templates padrão" };
    }

    const { error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .delete()
      .eq("key", key);
    if (error) return { success: false, error: error.message };

    await auditMutation(actor, {
      action: "DELETE",
      entity: "WhatsappTemplate",
      entityId: key,
    });
    revalidateAdmin(["/admin/whatsapp", "/admin/whatsapp/templates"]);
    return { success: true };
  });
}

export async function toggleWhatsappTemplate(
  key: string,
  active: boolean,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .update({ active, updatedAt: new Date().toISOString() })
      .eq("key", key);
    if (error) return { success: false, error: error.message };

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "WhatsappTemplate",
      entityId: key,
      metadata: { active },
    });
    revalidateAdmin(["/admin/whatsapp", "/admin/whatsapp/templates"]);
    return { success: true };
  });
}

export async function resetTemplateToDefault(key: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const defaultTemplates: Record<string, { template: string; name: string }> = {
      new_order_customer: {
        name: "Novo Pedido - Cliente",
        template: `🛒 *Pedido Recebido!*

Olá {{customerName}}!

Recebemos seu pedido #{{orderId}} no valor de {{amount}}.

⏳ Estamos aguardando a confirmação do pagamento. Assim que for aprovado, começaremos a preparar seu pedido.

Agradecemos a preferência! 💜`,
      },
      new_order_admin: {
        name: "Novo Pedido - Vendedor",
        template: `🛒 *Novo Pedido!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Valor: {{amount}}

Status: Aguardando pagamento`,
      },
      payment_approved_customer: {
        name: "Pagamento Aprovado - Cliente",
        template: `✅ *Pagamento Aprovado!*

Olá {{customerName}}!

Seu pagamento do pedido #{{orderId}} no valor de {{amount}} foi aprovado.

🧵 Agora vamos começar a preparar seu pedido com muito carinho!

Em breve enviaremos mais atualizações.`,
      },
      payment_approved_admin: {
        name: "Pagamento Aprovado - Vendedor",
        template: `✅ *Pagamento Aprovado!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Valor: {{amount}}

O pagamento foi confirmado e o pedido está pronto para preparação.`,
      },
      order_processing_customer: {
        name: "Pedido em Preparação - Cliente",
        template: `🧵 *Pedido em Preparação!*

Olá {{customerName}}!

Seu pedido #{{orderId}} está sendo preparado com muito carinho.

Estamos bordando/separando todos os itens. Em breve ele será enviado!

Agradecemos a paciência. 💜`,
      },
      order_shipped_customer: {
        name: "Pedido Enviado - Cliente",
        template: `📦 *Pedido Enviado!*

Olá {{customerName}}!

Seu pedido #{{orderId}} foi enviado!

🚚 Código de rastreio: {{trackingCode}}

Você pode acompanhar pelo site dos Correios ou transportadora.

Obrigada por comprar conosco! 💜`,
      },
      order_shipped_admin: {
        name: "Pedido Enviado - Vendedor",
        template: `📦 *Pedido Enviado!*

Pedido: #{{orderId}}
Cliente: {{customerName}}
Rastreio: {{trackingCode}}

O pedido foi marcado como enviado.`,
      },
      order_delivered_customer: {
        name: "Pedido Entregue - Cliente",
        template: `🎉 *Pedido Entregue!*

Olá {{customerName}}!

Seu pedido #{{orderId}} foi entregue!

Esperamos que você ame seus produtos. 💜

Se puder, deixe uma avaliação na nossa loja. Sua opinião é muito importante!

Obrigada por comprar conosco!`,
      },
      order_cancelled_customer: {
        name: "Pedido Cancelado - Cliente",
        template: `❌ *Pedido Cancelado*

Olá {{customerName}}.

Infelizmente seu pedido #{{orderId}} no valor de {{amount}} foi cancelado.

Se você tiver alguma dúvida ou precisar de ajuda, entre em contato conosco.

Agradecemos a compreensão.`,
      },
      order_cancelled_admin: {
        name: "Pedido Cancelado - Vendedor",
        template: `❌ *Pedido Cancelado*

Pedido: #{{orderId}}
Cliente: {{customerName}}

O pedido foi cancelado.`,
      },
      outreach_pending_payment: {
        name: "Cobrança - Pagamento Pendente",
        template: `Olá {{customerName}}! 👋

Vi que você tem um pedido *#{{orderId}}* no valor de *{{amount}}* aguardando pagamento.

Finalize aqui: {{checkoutUrl}}

Posso te ajudar com alguma dúvida? 💜`,
      },
      outreach_abandoned_cart: {
        name: "Recuperação - Sacola Abandonada",
        template: `Olá {{customerName}}! 👋

Notei que você deixou itens na sacola:
{{cartSummary}}

Total: *{{cartTotal}}*

Quer finalizar sua compra? Estou à disposição para ajudar! 🛒`,
      },
      outreach_generic: {
        name: "Contato Personalizado",
        template: `Olá {{customerName}}!

{{message}}

{{storeName}}`,
      },
    };

    const defaultTemplate = defaultTemplates[key];
    if (!defaultTemplate) {
      return { success: false, error: "Template padrão não encontrado" };
    }

    const { error } = await getDb()
      .from(TABLES.WhatsappTemplate)
      .update({
        template: defaultTemplate.template,
        name: defaultTemplate.name,
        updatedAt: new Date().toISOString(),
      })
      .eq("key", key);
    if (error) return { success: false, error: error.message };

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "WhatsappTemplate",
      entityId: key,
      metadata: { resetToDefault: true },
    });
    revalidateAdmin(["/admin/whatsapp", "/admin/whatsapp/templates"]);
    return { success: true };
  });
}

// Get available template variables for frontend display
export async function getTemplateVariables() {
  return withAdminRead(async () => {
    return [
      { key: "{{orderId}}", description: "ID do pedido (últimos 8 caracteres)", example: "12345678" },
      { key: "{{customerName}}", description: "Nome do cliente", example: "Maria Silva" },
      { key: "{{amount}}", description: "Valor formatado (R$)", example: "R$ 150,00" },
      { key: "{{amountCents}}", description: "Valor em centavos", example: "15000" },
      { key: "{{trackingCode}}", description: "Código de rastreio", example: "AA123456789BR" },
      { key: "{{storeName}}", description: "Nome da loja", example: "Bordadeiras" },
      { key: "{{orderDate}}", description: "Data do pedido", example: "10/06/2026" },
      { key: "{{checkoutUrl}}", description: "Link de checkout (outreach)", example: "https://loja.com/checkout?order=abc" },
      { key: "{{cartSummary}}", description: "Itens da sacola (outreach)", example: "• Linha × 2" },
      { key: "{{cartTotal}}", description: "Total da sacola (outreach)", example: "R$ 89,90" },
      { key: "{{message}}", description: "Mensagem personalizada (outreach)", example: "Temos novidades para você!" },
    ];
  });
}