import express from "express";
import {
  startBaileys,
  reconnect,
  logoutSession,
  getQrPayload,
  sendAdminMessage,
  getConnectionStatus,
} from "./baileys.js";

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

app.get("/session/status", (_req, res) => {
  res.json(getConnectionStatus());
});

app.get("/session/qr", async (_req, res) => {
  const data = await getQrPayload();
  res.json(data);
});

app.post("/session/reconnect", async (_req, res) => {
  await reconnect();
  res.json({ status: "reconnecting" });
});

app.post("/session/logout", async (_req, res) => {
  await logoutSession();
  res.json({ status: "disconnected" });
});

app.post("/notify/new-order", async (req, res) => {
  const { orderId, customerName, amountCents } = req.body as {
    orderId: string;
    customerName: string;
    amountCents: number;
  };
  await sendAdminMessage(
    `🛒 Novo pedido #${orderId.slice(-8)}\nCliente: ${customerName}\nTotal: ${formatBRL(amountCents)}`
  );
  res.json({ ok: true });
});

app.post("/notify/payment-approved", async (req, res) => {
  const { orderId, customerName, amountCents } = req.body as {
    orderId: string;
    customerName: string;
    amountCents: number;
  };
  await sendAdminMessage(
    `✅ Pagamento aprovado — pedido #${orderId.slice(-8)}\nCliente: ${customerName}\nValor: ${formatBRL(amountCents)}`
  );
  res.json({ ok: true });
});

app.post("/notify/order-shipped", async (req, res) => {
  const { orderId, customerName, trackingCode } = req.body as {
    orderId: string;
    customerName: string;
    trackingCode?: string;
  };
  const track = trackingCode ? `\nRastreio: ${trackingCode}` : "";
  await sendAdminMessage(
    `📦 Pedido enviado #${orderId.slice(-8)}\nCliente: ${customerName}${track}`
  );
  res.json({ ok: true });
});

app.post("/notify/order-cancelled", async (req, res) => {
  const { orderId, customerName } = req.body as { orderId: string; customerName: string };
  await sendAdminMessage(
    `❌ Pedido cancelado #${orderId.slice(-8)}\nCliente: ${customerName}`
  );
  res.json({ ok: true });
});

app.post("/messages/send", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text) {
    res.status(400).json({ error: "text required" });
    return;
  }
  await sendAdminMessage(text);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`WhatsApp service on :${PORT}`);
  void startBaileys().catch((err) => {
    console.error("[whatsapp] Initial Baileys start failed:", err);
  });
});
