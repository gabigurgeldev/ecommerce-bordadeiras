const baseUrl = process.env.WHATSAPP_SERVICE_URL ?? "http://localhost:4001";
const secret = process.env.WHATSAPP_SERVICE_SECRET ?? "";

async function whatsappFetch(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WhatsApp service error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function notifyNewOrder(params: {
  orderId: string;
  customerName: string;
  amountCents: number;
}) {
  return whatsappFetch("/notify/new-order", params);
}

export async function notifyPaymentApproved(params: {
  orderId: string;
  customerName: string;
  amountCents: number;
  paymentId: string;
}) {
  return whatsappFetch("/notify/payment-approved", params);
}

export async function notifyOrderShipped(params: {
  orderId: string;
  customerName: string;
  trackingCode?: string | null;
}) {
  return whatsappFetch("/notify/order-shipped", params);
}

export async function notifyOrderCancelled(params: {
  orderId: string;
  customerName: string;
}) {
  return whatsappFetch("/notify/order-cancelled", params);
}

export async function getWhatsappQr(): Promise<{ qr?: string; status: string }> {
  const res = await fetch(`${baseUrl}/session/qr`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
  if (!res.ok) throw new Error(`WhatsApp QR error ${res.status}`);
  return res.json();
}

export async function reconnectWhatsapp(): Promise<{ status: string }> {
  const res = await fetch(`${baseUrl}/session/reconnect`, {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
  if (!res.ok) throw new Error(`WhatsApp reconnect error ${res.status}`);
  return res.json();
}
