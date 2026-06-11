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
import {
  appendLog,
  getRecentLogs,
  ingestLog,
  subscribe,
  type WhatsappLogCategory,
  type WhatsappLogLevel,
} from "./log-bus.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 4001);
const SECRET = process.env.WHATSAPP_SERVICE_SECRET ?? "";
const DEFAULT_STORE_NAME = process.env.STORE_NAME ?? "Bordadeiras";

app.get("/health", async (_req, res) => {
  const { status } = getConnectionStatus();
  const recipients = await getActiveRecipients();
  const supabase = getSupabaseConfigStatus();
  res.json({
    ok: true,
    connected: status === "connected",
    activeRecipients: recipients.length,
    supabaseConfigured: supabase.configured,
    ...(supabase.missing.length > 0 ? { supabaseMissing: supabase.missing } : {}),
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

app.get("/logs", (_req, res) => {
  res.json({ logs: getRecentLogs() });
});

app.get("/logs/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (entry: ReturnType<typeof appendLog>) => {
    res.write(`event: log\ndata: ${JSON.stringify(entry)}\n\n`);
  };

  const unsub = subscribe(send);
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsub();
  });
});

app.post("/logs/ingest", (req, res) => {
  const body = req.body as {
    level?: WhatsappLogLevel;
    category?: WhatsappLogCategory;
    message?: string;
    meta?: Record<string, string | number | boolean | null>;
  };

  if (!body.level || !body.category || !body.message?.trim()) {
    res.status(400).json({ error: "level, category and message required" });
    return;
  }

  const entry = ingestLog({
    level: body.level,
    category: body.category,
    message: body.message.trim(),
    meta: body.meta,
  });
  res.json({ ok: true, id: entry.id });
});

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

async function deliverAdminMessage(
  text: string,
  notifyEvent?: string,
): Promise<AdminNotifyOutcome> {
  try {
    const result = await sendAdminMessage(text);
    if (notifyEvent) {
      appendLog({
        level: "success",
        category: "notify",
        message: `Alerta admin enviado — ${notifyEvent}`,
        meta: { recipientsSent: result.sent, skipped: result.skipped },
      });
    }
    return {
      adminNotified: true,
      adminRecipientsSent: result.sent,
    };
  } catch (err) {
    const message = errorMessage(err);
    if (isConnectionError(message)) {
      if (notifyEvent) {
        appendLog({
          level: "error",
          category: "notify",
          message: `Falha no alerta admin — ${notifyEvent}`,
          meta: { error: message.replace(/^[A-Z_]+:\s*/, "") },
        });
      }
      throw err;
    }
    const warning = message.replace(/^[A-Z_]+:\s*/, "");
    if (notifyEvent) {
      appendLog({
        level: "warn",
        category: "notify",
        message: `Alerta admin parcial — ${notifyEvent}`,
        meta: { warning },
      });
    }
    return {
      adminNotified: false,
      adminRecipientsSent: 0,
      adminWarning: warning,
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
    appendLog({
      level: "error",
      category: "session",
      message: "POST /session/reconnect falhou",
      meta: { error: errorMessage(err) },
    });
    res.status(500).json({ error: errorMessage(err) });
  }
});

app.post("/session/logout", async (_req, res) => {
  try {
    await logoutSession();
    res.json({ status: "disconnected" });
  } catch (err) {
    appendLog({
      level: "error",
      category: "session",
      message: "POST /session/logout falhou",
      meta: { error: errorMessage(err) },
    });
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
    appendLog({
      level: "success",
      category: "send",
      message: "Template enviado ao cliente",
      meta: { templateKey },
    });
    res.json({ ok: true, sent: true });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "POST /messages/send-to-customer falhou",
      meta: { templateKey, error: errorMessage(err) },
    });
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
    appendLog({
      level: "success",
      category: "send",
      message: "Mensagem personalizada enviada ao cliente",
    });
    res.json({ ok: true, sent: true });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "POST /messages/send-to-customer-raw falhou",
      meta: { error: errorMessage(err) },
    });
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
    appendLog({
      level: "success",
      category: "send",
      message: "Template enviado aos destinatários admin",
      meta: { templateKey, recipientsSent: result.sent },
    });
    res.json({ ok: true, sent: true, recipientsSent: result.sent });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "POST /messages/send-to-admin falhou",
      meta: { templateKey, error: errorMessage(err) },
    });
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
    appendLog({
      level: "success",
      category: "send",
      message: "Texto enviado aos destinatários admin",
      meta: { recipientsSent: result.sent },
    });
    res.json({ ok: true, recipientsSent: result.sent });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "POST /messages/send falhou",
      meta: { error: errorMessage(err) },
    });
    res.status(500).json({ error: errorMessage(err) });
  }
});

app.post("/messages/send-test-admin", async (_req, res) => {
  const testMessage = `🔔 *Teste de alerta — ${DEFAULT_STORE_NAME}*

Esta é uma mensagem de teste do painel admin.
Se você recebeu, os destinatários cadastrados estão configurados corretamente.`;

  try {
    const result = await sendAdminMessage(testMessage);
    appendLog({
      level: "success",
      category: "send",
      message: "Teste de alerta admin enviado",
      meta: { recipientsSent: result.sent, skipped: result.skipped },
    });
    res.json({
      ok: true,
      sent: true,
      recipientsSent: result.sent,
      skipped: result.skipped,
    });
  } catch (err) {
    appendLog({
      level: "error",
      category: "send",
      message: "Teste de alerta admin falhou",
      meta: { error: errorMessage(err) },
    });
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

  appendLog({
    level: "info",
    category: "notify",
    message: "Notificação new-order recebida",
    meta: { orderId: formatOrderId(orderId) },
  });

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
    adminOutcome = await deliverAdminMessage(
      formatTemplate(adminTemplate, vars),
      "new-order",
    );
  } catch (err) {
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
      appendLog({
        level: "success",
        category: "notify",
        message: "Cliente notificado — new-order",
        meta: { orderId: formatOrderId(orderId) },
      });
    } catch (err) {
      customerError = errorMessage(err);
      appendLog({
        level: "warn",
        category: "notify",
        message: "Falha ao notificar cliente — new-order",
        meta: { orderId: formatOrderId(orderId), error: customerError },
      });
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

  appendLog({
    level: "info",
    category: "notify",
    message: "Notificação payment-approved recebida",
    meta: { orderId: formatOrderId(orderId) },
  });

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
    adminOutcome = await deliverAdminMessage(
      formatTemplate(adminTemplate, vars),
      "payment-approved",
    );
  } catch (err) {
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
      appendLog({
        level: "success",
        category: "notify",
        message: "Cliente notificado — payment-approved",
        meta: { orderId: formatOrderId(orderId) },
      });
    } catch (err) {
      customerError = errorMessage(err);
      appendLog({
        level: "warn",
        category: "notify",
        message: "Falha ao notificar cliente — payment-approved",
        meta: { orderId: formatOrderId(orderId), error: customerError },
      });
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
    appendLog({
      level: "info",
      category: "notify",
      message: "order-processing ignorado — sem telefone do cliente",
      meta: { orderId: formatOrderId(orderId) },
    });
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
    appendLog({
      level: "success",
      category: "notify",
      message: "Cliente notificado — order-processing",
      meta: { orderId: formatOrderId(orderId) },
    });
    res.json({ ok: true, notified: true });
  } catch (err) {
    appendLog({
      level: "error",
      category: "notify",
      message: "notify/order-processing falhou",
      meta: { orderId: formatOrderId(orderId), error: errorMessage(err) },
    });
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

  appendLog({
    level: "info",
    category: "notify",
    message: "Notificação order-shipped recebida",
    meta: { orderId: formatOrderId(orderId) },
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
    adminOutcome = await deliverAdminMessage(
      formatTemplate(adminTemplate, vars),
      "order-shipped",
    );
  } catch (err) {
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
      appendLog({
        level: "success",
        category: "notify",
        message: "Cliente notificado — order-shipped",
        meta: { orderId: formatOrderId(orderId) },
      });
    } catch (err) {
      customerError = errorMessage(err);
      appendLog({
        level: "warn",
        category: "notify",
        message: "Falha ao notificar cliente — order-shipped",
        meta: { orderId: formatOrderId(orderId), error: customerError },
      });
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
    appendLog({
      level: "info",
      category: "notify",
      message: "order-delivered ignorado — sem telefone do cliente",
      meta: { orderId: formatOrderId(orderId) },
    });
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
    appendLog({
      level: "success",
      category: "notify",
      message: "Cliente notificado — order-delivered",
      meta: { orderId: formatOrderId(orderId) },
    });
    res.json({ ok: true, notified: true });
  } catch (err) {
    appendLog({
      level: "error",
      category: "notify",
      message: "notify/order-delivered falhou",
      meta: { orderId: formatOrderId(orderId), error: errorMessage(err) },
    });
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

  appendLog({
    level: "info",
    category: "notify",
    message: "Notificação order-cancelled recebida",
    meta: { orderId: formatOrderId(orderId) },
  });

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
    adminOutcome = await deliverAdminMessage(
      formatTemplate(adminTemplate, vars),
      "order-cancelled",
    );
  } catch (err) {
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
      appendLog({
        level: "success",
        category: "notify",
        message: "Cliente notificado — order-cancelled",
        meta: { orderId: formatOrderId(orderId) },
      });
    } catch (err) {
      customerError = errorMessage(err);
      appendLog({
        level: "warn",
        category: "notify",
        message: "Falha ao notificar cliente — order-cancelled",
        meta: { orderId: formatOrderId(orderId), error: customerError },
      });
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
  appendLog({
    level: "info",
    category: "system",
    message: `Serviço WhatsApp iniciado na porta ${PORT}`,
  });

  const supabase = getSupabaseConfigStatus();
  if (!supabase.configured) {
    appendLog({
      level: "warn",
      category: "system",
      message: "Supabase não configurado no whatsapp-service",
      meta: { missing: supabase.missing.join(", ") },
    });
  } else {
    appendLog({
      level: "success",
      category: "system",
      message: "Supabase configurado",
      meta: { url: supabase.url ?? "" },
    });
  }

  void startBaileys().catch((err) => {
    appendLog({
      level: "error",
      category: "system",
      message: "Falha ao iniciar Baileys na subida do serviço",
      meta: { error: errorMessage(err) },
    });
  });
});
