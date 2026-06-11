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
import {
  getActiveRecipients,
  getSupabaseConfigStatus,
  getTemplateByKey,
  getTemplateForRecipient,
} from "./db.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4001);
const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? "";
const DEFAULT_STORE_NAME = process.env.STORE_NAME ?? "Bordadeiras";

app.get("/health", async (_req, res) => {
  const { status } = getConnectionStatus();
  const recipients = await getActiveRecipients();
  res.json({
    ok: true,
    connected: status === "connected",
    activeRecipients: recipients.length,
  });
});

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatOrderId(orderId: string) {
  return orderId.slice(-8).toUpperCase();
}

function formatTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;
  const enriched = { ...variables };
  if (enriched.amountCents != null && enriched.amount == null) {
    enriched.amount = formatBRL(Number(enriched.amountCents));
  }

  for (const [key, value] of Object.entries(enriched)) {
    if (value !== undefined && value !== "") {
      result = result.replace(new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, "g"), String(value));
    }
  }
  return result;
}

function buildNotifyVariables(input: {
  orderId: string;
  customerName: string;
  amountCents?: number;
  storeName?: string;
  orderDate?: string;
  trackingCode?: string;
}) {
  return {
    orderId: formatOrderId(input.orderId),
    customerName: input.customerName,
    storeName: input.storeName ?? DEFAULT_STORE_NAME,
    orderDate: input.orderDate ?? "",
    amount: input.amountCents != null ? formatBRL(input.amountCents) : undefined,
    trackingCode: input.trackingCode,
  };
}

async function getOrFallbackTemplate(
  event: string,
  recipientType: "CUSTOMER" | "ADMIN",
  fallbackTemplate: string
): Promise<string> {
  const template = await getTemplateForRecipient(event, recipientType);
  return template?.template ?? fallbackTemplate;
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Unknown error";
}

function isConnectionError(message: string) {
  return message.startsWith("NOT_CONNECTED:");
}

type AdminNotifyOutcome = {
  adminNotified: boolean;
  adminRecipientsSent: number;
  adminWarning?: string;
};

async function deliverAdminMessage(text: string): Promise<AdminNotifyOutcome> {
  try {
    const result = await sendAdminMessage(text);
    return {
      adminNotified: true,
      adminRecipientsSent: result.sent,
    };
  } catch (err) {
    const message = errorMessage(err);
    if (isConnectionError(message)) {
      throw err;
    }
    console.warn("[whatsapp] admin notify partial failure:", message);
    return {
      adminNotified: false,
      adminRecipientsSent: 0,
      adminWarning: message.replace(/^[A-Z_]+:\s*/, ""),
    };
  }
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
      error: errorMessage(err),
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
    res.status(500).json({ error: errorMessage(err) });
  }
});

app.post("/session/logout", async (_req, res) => {
  try {
    await logoutSession();
    res.json({ status: "disconnected" });
  } catch (err) {
    console.error("[whatsapp] POST /session/logout failed:", err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

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

  try {
    const template = await getTemplateByKey(templateKey);
    if (!template) {
      res.status(404).json({ error: `Template ${templateKey} not found or inactive` });
      return;
    }

    const formattedMessage = formatTemplate(template.template, variables ?? {});
    await sendMessageToPhone(phone, formattedMessage);
    res.json({ ok: true, sent: true });
  } catch (err) {
    console.error("[whatsapp] POST /messages/send-to-customer failed:", err);
    res.status(500).json({ error: errorMessage(err), sent: false });
  }
});

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
    res.status(500).json({ error: errorMessage(err), sent: false });
  }
});

app.post("/messages/send-to-admin", async (req, res) => {
  const { templateKey, variables } = req.body as {
    templateKey: string;
    variables?: Record<string, string | number>;
  };

  if (!templateKey) {
    res.status(400).json({ error: "templateKey required" });
    return;
  }

  try {
    const template = await getTemplateByKey(templateKey);
    if (!template) {
      res.status(404).json({ error: `Template ${templateKey} not found or inactive` });
      return;
    }

    const formattedMessage = formatTemplate(template.template, variables ?? {});
    const result = await sendAdminMessage(formattedMessage);
    res.json({ ok: true, sent: true, recipientsSent: result.sent });
  } catch (err) {
    console.error("[whatsapp] POST /messages/send-to-admin failed:", err);
    res.status(500).json({ error: errorMessage(err), sent: false });
  }
});

app.post("/messages/send", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }

  try {
    const result = await sendAdminMessage(text);
    res.json({ ok: true, recipientsSent: result.sent });
  } catch (err) {
    console.error("[whatsapp] POST /messages/send failed:", err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

app.post("/messages/send-test-admin", async (_req, res) => {
  const testMessage = `🔔 *Teste de alerta — ${DEFAULT_STORE_NAME}*

Esta é uma mensagem de teste do painel admin.
Se você recebeu, os destinatários cadastrados estão configurados corretamente.`;

  try {
    const result = await sendAdminMessage(testMessage);
    res.json({
      ok: true,
      sent: true,
      recipientsSent: result.sent,
      skipped: result.skipped,
    });
  } catch (err) {
    console.error("[whatsapp] POST /messages/send-test-admin failed:", err);
    res.status(500).json({ error: errorMessage(err), sent: false });
  }
});

app.post("/notify/new-order", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    amountCents?: number;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName || amountCents == null) {
    res.status(400).json({ error: "orderId, customerName and amountCents required" });
    return;
  }

  const vars = buildNotifyVariables({ orderId, customerName, amountCents, storeName, orderDate });
  let adminOutcome: AdminNotifyOutcome;
  let customerNotified = false;
  let customerError: string | undefined;

  try {
    const adminTemplate = await getOrFallbackTemplate(
      "NEW_ORDER",
      "ADMIN",
      `🛒 Novo pedido #{{orderId}}\nCliente: {{customerName}}\nTotal: {{amount}}`
    );
    adminOutcome = await deliverAdminMessage(formatTemplate(adminTemplate, vars));
  } catch (err) {
    console.error("[whatsapp] notify/new-order admin failed:", err);
    res.status(500).json({ error: errorMessage(err), adminNotified: false });
    return;
  }

  if (customerPhone) {
    try {
      const customerTemplate = await getOrFallbackTemplate(
        "NEW_ORDER",
        "CUSTOMER",
        `🛒 *Pedido Recebido!*\n\nOlá {{customerName}}!\n\nRecebemos seu pedido #{{orderId}} no valor de {{amount}}.\n\n⏳ Estamos aguardando a confirmação do pagamento.`
      );
      await sendMessageToPhone(customerPhone, formatTemplate(customerTemplate, vars));
      customerNotified = true;
    } catch (err) {
      customerError = errorMessage(err);
      console.error("[whatsapp] notify/new-order customer failed:", err);
    }
  }

  res.json({
    ok: true,
    ...adminOutcome,
    notifiedCustomer: customerNotified,
    customerError,
  });
});

app.post("/notify/payment-approved", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    amountCents?: number;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName || amountCents == null) {
    res.status(400).json({ error: "orderId, customerName and amountCents required" });
    return;
  }

  const vars = buildNotifyVariables({ orderId, customerName, amountCents, storeName, orderDate });
  let adminOutcome: AdminNotifyOutcome;
  let customerNotified = false;
  let customerError: string | undefined;

  try {
    const adminTemplate = await getOrFallbackTemplate(
      "PAYMENT_APPROVED",
      "ADMIN",
      `✅ Pagamento aprovado — pedido #{{orderId}}\nCliente: {{customerName}}\nValor: {{amount}}`
    );
    adminOutcome = await deliverAdminMessage(formatTemplate(adminTemplate, vars));
  } catch (err) {
    console.error("[whatsapp] notify/payment-approved admin failed:", err);
    res.status(500).json({ error: errorMessage(err), adminNotified: false });
    return;
  }

  if (customerPhone) {
    try {
      const customerTemplate = await getOrFallbackTemplate(
        "PAYMENT_APPROVED",
        "CUSTOMER",
        `✅ *Pagamento Aprovado!*\n\nOlá {{customerName}}!\n\nSeu pagamento do pedido #{{orderId}} no valor de {{amount}} foi aprovado.\n\n🧵 Agora vamos começar a preparar seu pedido!`
      );
      await sendMessageToPhone(customerPhone, formatTemplate(customerTemplate, vars));
      customerNotified = true;
    } catch (err) {
      customerError = errorMessage(err);
      console.error("[whatsapp] notify/payment-approved customer failed:", err);
    }
  }

  res.json({
    ok: true,
    ...adminOutcome,
    notifiedCustomer: customerNotified,
    customerError,
  });
});

app.post("/notify/order-processing", async (req, res) => {
  const { orderId, customerName, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName) {
    res.status(400).json({ error: "orderId and customerName required" });
    return;
  }

  if (!customerPhone) {
    res.json({ ok: true, notified: false, reason: "no_customer_phone" });
    return;
  }

  try {
    const vars = buildNotifyVariables({ orderId, customerName, storeName, orderDate });
    const template = await getOrFallbackTemplate(
      "ORDER_PROCESSING",
      "CUSTOMER",
      `🧵 *Pedido em Preparação!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} está sendo preparado com muito carinho.`
    );
    await sendMessageToPhone(customerPhone, formatTemplate(template, vars));
    res.json({ ok: true, notified: true });
  } catch (err) {
    console.error("[whatsapp] notify/order-processing failed:", err);
    res.status(500).json({ error: errorMessage(err), notified: false });
  }
});

app.post("/notify/order-shipped", async (req, res) => {
  const { orderId, customerName, trackingCode, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    trackingCode?: string;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName) {
    res.status(400).json({ error: "orderId and customerName required" });
    return;
  }

  const vars = buildNotifyVariables({
    orderId,
    customerName,
    storeName,
    orderDate,
    trackingCode: trackingCode ?? "N/A",
  });

  let adminOutcome: AdminNotifyOutcome;
  let customerNotified = false;
  let customerError: string | undefined;

  try {
    const adminTemplate = await getOrFallbackTemplate(
      "ORDER_SHIPPED",
      "ADMIN",
      `📦 Pedido enviado #{{orderId}}\nCliente: {{customerName}}\nRastreio: {{trackingCode}}`
    );
    adminOutcome = await deliverAdminMessage(formatTemplate(adminTemplate, vars));
  } catch (err) {
    console.error("[whatsapp] notify/order-shipped admin failed:", err);
    res.status(500).json({ error: errorMessage(err), adminNotified: false });
    return;
  }

  if (customerPhone) {
    try {
      const customerTemplate = await getOrFallbackTemplate(
        "ORDER_SHIPPED",
        "CUSTOMER",
        `📦 *Pedido Enviado!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} foi enviado!\n\n🚚 Código de rastreio: {{trackingCode}}`
      );
      await sendMessageToPhone(customerPhone, formatTemplate(customerTemplate, vars));
      customerNotified = true;
    } catch (err) {
      customerError = errorMessage(err);
      console.error("[whatsapp] notify/order-shipped customer failed:", err);
    }
  }

  res.json({
    ok: true,
    ...adminOutcome,
    notifiedCustomer: customerNotified,
    customerError,
  });
});

app.post("/notify/order-delivered", async (req, res) => {
  const { orderId, customerName, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName) {
    res.status(400).json({ error: "orderId and customerName required" });
    return;
  }

  if (!customerPhone) {
    res.json({ ok: true, notified: false, reason: "no_customer_phone" });
    return;
  }

  try {
    const vars = buildNotifyVariables({ orderId, customerName, storeName, orderDate });
    const template = await getOrFallbackTemplate(
      "ORDER_DELIVERED",
      "CUSTOMER",
      `🎉 *Pedido Entregue!*\n\nOlá {{customerName}}!\n\nSeu pedido #{{orderId}} foi entregue!\n\nEsperamos que você ame seus produtos. 💜`
    );
    await sendMessageToPhone(customerPhone, formatTemplate(template, vars));
    res.json({ ok: true, notified: true });
  } catch (err) {
    console.error("[whatsapp] notify/order-delivered failed:", err);
    res.status(500).json({ error: errorMessage(err), notified: false });
  }
});

app.post("/notify/order-cancelled", async (req, res) => {
  const { orderId, customerName, amountCents, customerPhone, storeName, orderDate } = req.body as {
    orderId?: string;
    customerName?: string;
    amountCents?: number;
    customerPhone?: string;
    storeName?: string;
    orderDate?: string;
  };

  if (!orderId || !customerName) {
    res.status(400).json({ error: "orderId and customerName required" });
    return;
  }

  const vars = buildNotifyVariables({ orderId, customerName, amountCents, storeName, orderDate });
  let adminOutcome: AdminNotifyOutcome;
  let customerNotified = false;
  let customerError: string | undefined;

  try {
    const adminTemplate = await getOrFallbackTemplate(
      "ORDER_CANCELLED",
      "ADMIN",
      `❌ Pedido cancelado #{{orderId}}\nCliente: {{customerName}}`
    );
    adminOutcome = await deliverAdminMessage(formatTemplate(adminTemplate, vars));
  } catch (err) {
    console.error("[whatsapp] notify/order-cancelled admin failed:", err);
    res.status(500).json({ error: errorMessage(err), adminNotified: false });
    return;
  }

  if (customerPhone) {
    try {
      const customerTemplate = await getOrFallbackTemplate(
        "ORDER_CANCELLED",
        "CUSTOMER",
        `❌ *Pedido Cancelado*\n\nOlá {{customerName}}.\n\nInfelizmente seu pedido #{{orderId}} foi cancelado.`
      );
      await sendMessageToPhone(customerPhone, formatTemplate(customerTemplate, vars));
      customerNotified = true;
    } catch (err) {
      customerError = errorMessage(err);
      console.error("[whatsapp] notify/order-cancelled customer failed:", err);
    }
  }

  res.json({
    ok: true,
    ...adminOutcome,
    notifiedCustomer: customerNotified,
    customerError,
  });
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
