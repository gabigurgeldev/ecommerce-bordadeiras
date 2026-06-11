import express from "express";
import {
  startBaileys,
  reconnect,
  logoutSession,
  getQrPayload,
  sendAdminMessage,
  getConnectionStatus,
  sendMessageToPhone,
} from "./baileys.js";
import { getSupabaseConfigStatus, getTemplateByKey, getTemplateForRecipient } from "./db.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4001);
const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? "";

app.get("/health", (_req, res) => res.json({ ok: true }));

function authMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!SECRET) return next();
  const header = req.headers.authorization;
  if (header !== `Bearer ${SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.use(authMiddleware);

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Helper to format template variables
function formatTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    }
  }
  return result;
}

// Helper to get template or use default fallback
async function getOrFallbackTemplate(
  event: string,
  recipientType: "CUSTOMER" | "ADMIN",
  fallbackTemplate: string
): Promise<string> {
  const template = await getTemplateForRecipient(event, recipientType);
  return template?.template ?? fallbackTemplate;
}

app.get("/session/status", (_req, res) => {
  res.json(getConnectionStatus());
});

app.get("/session/qr", async (_req, res) => {
  try {
    const data = await getQrPayload();
    res.json(data);
  } catch (err) {
    console.error("[whatsapp] GET /session/qr failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to get QR",
      status: getConnectionStatus().status,
    });
  }
});

app.post("/session/reconnect", async (_req, res) => {
  try {
    await reconnect();
    res.json({ status: "reconnecting" });
  } catch (err) {
    console.error("[whatsapp] POST /session/reconnect failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to reconnect",
    });
  }
});

app.post("/session/logout", async (_req, res) => {
  try {
    await logoutSession();
    res.json({ status: "disconnected" });
  } catch (err) {
    console.error("[whatsapp] POST /session/logout failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to logout",
    });
  }
});

// Send message to customer using template
app.post("/messages/send-to-customer", async (req, res) => {
  const { phone, templateKey, variables } = req.body as {
    phone: string;
    templateKey: string;
    variables?: Record<string, string | number>;
  };

  if (!phone || !templateKey) {
    res.status(400).json({ error: "phone and templateKey required" });
    return;
  }

  const template = await getTemplateByKey(templateKey);
  if (!template) {
    res.status(404).json({ error: `Template ${templateKey} not found or inactive` });
    return;
  }

  const formattedMessage = formatTemplate(template.template, {
    ...variables,
    amount: variables?.amountCents ? formatBRL(Number(variables.amountCents)) : undefined,
  });

  await sendMessageToPhone(phone, formattedMessage);
  res.json({ ok: true, sent: true });
});

// Send raw text message to customer (admin outreach)
app.post("/messages/send-to-customer-raw", async (req, res) => {
  const { phone, text } = req.body as { phone: string; text: string };

  if (!phone || !text?.trim()) {
    res.status(400).json({ error: "phone and text required" });
    return;
  }

  try {
    await sendMessageToPhone(phone, text.trim());
    res.json({ ok: true, sent: true });
  } catch (err) {
    console.error("[whatsapp] POST /messages/send-to-customer-raw failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to send message",
    });
  }
});

// Send message to admin using template
app.post("/messages/send-to-admin", async (req, res) => {
  const { templateKey, variables } = req.body as {
    templateKey: string;
    variables?: Record<string, string | number>;
  };

  if (!templateKey) {
    res.status(400).json({ error: "templateKey required" });
    return;
  }

  const template = await getTemplateByKey(templateKey);
  if (!template) {
    res.status(404).json({ error: `Template ${templateKey} not found or inactive` });
    return;
  }

  const formattedMessage = formatTemplate(template.template, {
    ...variables,
    amount: variables?.amountCents ? formatBRL(Number(variables.amountCents)) : undefined,
  });

  await sendAdminMessage(formattedMessage);
  res.json({ ok: true, sent: true });
});

// Legacy endpoint for custom messages
app.post("/messages/send", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }
  await sendAdminMessage(text);
  res.json({ ok: true });
});

// New Order - notifies both admin and optionally customer
app.post("/notify/new-order", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    amountCents: number;
    customerPhone?: string;
  };

  // Notify admin using template
  const adminTemplate = await getOrFallbackTemplate(
    "NEW_ORDER",
    "ADMIN",
    `🛒 Novo pedido #{{orderId}}\nCliente: {{customerName}}\nTotal: {{amount}}`
  );
  const adminMessage = formatTemplate(adminTemplate, {
    orderId: orderId.slice(-8),
    customerName,
    amountCents,
    amount: formatBRL(amountCents),
  });
  await sendAdminMessage(adminMessage);

  // Notify customer if phone provided
  if (customerPhone) {
    const customerTemplate = await getOrFallbackTemplate(
      "NEW_ORDER",
      "CUSTOMER",
      `🛒 *Pedido Recebido!*\n\nOlá {{customerName}}!\n\nRecebemos seu pedido #{{orderId}} no valor de {{amount}}.\n\n⏳ Estamos aguardando a confirmação do pagamento.`
    );
    const customerMessage = formatTemplate(customerTemplate, {
      orderId: orderId.slice(-8),
      customerName,
      amountCents,
      amount: formatBRL(amountCents),
    });
    await sendMessageToPhone(customerPhone, customerMessage);
  }

  res.json({ ok: true, notifiedCustomer: !!customerPhone });
});

// Payment Approved - notifies both admin and optionally customer
app.post("/notify/payment-approved", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    amountCents: number;
    customerPhone?: string;
  };

  // Notify admin using template
  const adminTemplate = await getOrFallbackTemplate(
    "PAYMENT_APPROVED",
    "ADMIN",
    `✅ Pagamento aprovado — pedido #{{orderId}}\nCliente: {{customerName}}\nValor: {{amount}}`
  );
  const adminMessage = formatTemplate(adminTemplate, {
    orderId: orderId.slice(-8),
    customerName,
    amountCents,
    amount: formatBRL(amountCents),
  });
  await sendAdminMessage(adminMessage);

  // Notify customer if phone provided
  if (customerPhone) {
    const customerTemplate = await getOrFallbackTemplate(
      "PAYMENT_APPROVED",
      "CUSTOMER",
      `✅ *Pagamento Aprovado!*\n\nOlá {{customerName}}!\n\nSeu pagamento do pedido #{{orderId}} no valor de {{amount}} foi aprovado.\n\n🧵 Agora vamos começar a preparar seu pedido!`
    );
    const customerMessage = formatTemplate(customerTemplate, {
      orderId: orderId.slice(-8),
      customerName,
      amountCents,
      amount: formatBRL(amountCents),
    });
    await sendMessageToPhone(customerPhone, customerMessage);
  }

  res.json({ ok: true, notifiedCustomer: !!customerPhone });
});

// Order Processing - notifies customer
app.post("/notify/order-processing", async (req, res) => {
  const { orderId, customerName, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    customerPhone?: string;
  };

  if (!customerPhone) {
    res.json({ ok: true, notified: false, reason: "no_customer_phone" });
    return;
  }

  const template = await getOrFallbackTemplate(
    "ORDER_PROCESSING",
    "CUSTOMER",
    `🧵 *Pedido em Preparação!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} está sendo preparado com muito carinho.`
  );
  const message = formatTemplate(template, {
    orderId: orderId.slice(-8),
    customerName,
  });

  await sendMessageToPhone(customerPhone, message);
  res.json({ ok: true, notified: true });
});

// Order Shipped - notifies both admin and optionally customer
app.post("/notify/order-shipped", async (req, res) => {
  const { orderId, customerName, trackingCode, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    trackingCode?: string;
    customerPhone?: string;
  };

  // Notify admin using template
  const adminTemplate = await getOrFallbackTemplate(
    "ORDER_SHIPPED",
    "ADMIN",
    `📦 Pedido enviado #{{orderId}}\nCliente: {{customerName}}\nRastreio: {{trackingCode}}`
  );
  const adminMessage = formatTemplate(adminTemplate, {
    orderId: orderId.slice(-8),
    customerName,
    trackingCode: trackingCode ?? "N/A",
  });
  await sendAdminMessage(adminMessage);

  // Notify customer if phone provided
  if (customerPhone) {
    const customerTemplate = await getOrFallbackTemplate(
      "ORDER_SHIPPED",
      "CUSTOMER",
      `📦 *Pedido Enviado!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} foi enviado!\n\n🚚 Código de rastreio: {{trackingCode}}`
    );
    const customerMessage = formatTemplate(customerTemplate, {
      orderId: orderId.slice(-8),
      customerName,
      trackingCode: trackingCode ?? "N/A",
    });
    await sendMessageToPhone(customerPhone, customerMessage);
  }

  res.json({ ok: true, notifiedCustomer: !!customerPhone });
});

// Order Delivered - notifies customer
app.post("/notify/order-delivered", async (req, res) => {
  const { orderId, customerName, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    customerPhone?: string;
  };

  if (!customerPhone) {
    res.json({ ok: true, notified: false, reason: "no_customer_phone" });
    return;
  }

  const template = await getOrFallbackTemplate(
    "ORDER_DELIVERED",
    "CUSTOMER",
    `🎉 *Pedido Entregue!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} foi entregue!\n\nEsperamos que você ame seus produtos. 💜`
  );
  const message = formatTemplate(template, {
    orderId: orderId.slice(-8),
    customerName,
  });

  await sendMessageToPhone(customerPhone, message);
  res.json({ ok: true, notified: true });
});

// Order Cancelled - notifies both admin and optionally customer
app.post("/notify/order-cancelled", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone } = req.body as {
    orderId: string;
    customerName: string;
    amountCents?: number;
    customerPhone?: string;
  };

  // Notify admin using template
  const adminTemplate = await getOrFallbackTemplate(
    "ORDER_CANCELLED",
    "ADMIN",
    `❌ Pedido cancelado #{{orderId}}\nCliente: {{customerName}}`
  );
  const adminMessage = formatTemplate(adminTemplate, {
    orderId: orderId.slice(-8),
    customerName,
  });
  await sendAdminMessage(adminMessage);

  // Notify customer if phone provided
  if (customerPhone) {
    const customerTemplate = await getOrFallbackTemplate(
      "ORDER_CANCELLED",
      "CUSTOMER",
      `❌ *Pedido Cancelado*\n\nOlá {{customerName}}.\n\nInfelizmente seu pedido #{{orderId}} foi cancelado.`
    );
    const customerMessage = formatTemplate(customerTemplate, {
      orderId: orderId.slice(-8),
      customerName,
      amountCents,
      amount: amountCents ? formatBRL(amountCents) : undefined,
    });
    await sendMessageToPhone(customerPhone, customerMessage);
  }

  res.json({ ok: true, notifiedCustomer: !!customerPhone });
});

app.listen(PORT, () => {
  console.log(`WhatsApp service on :${PORT}`);

  const supabase = getSupabaseConfigStatus();
  if (!supabase.configured) {
    console.error(
      `[whatsapp] AVISO: Supabase não configurado. Variáveis faltando: ${supabase.missing.join(", ")}`,
    );
    console.error(
      "[whatsapp] O QR pode funcionar, mas destinatários/templates e status no admin exigem Supabase.",
    );
  } else {
    console.log(`[whatsapp] Supabase OK (${supabase.url})`);
  }

  void startBaileys().catch((err) => {
    console.error("[whatsapp] Initial Baileys start failed:", err);
  });
});