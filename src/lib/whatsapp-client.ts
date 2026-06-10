import { getWhatsappServiceBaseUrl } from "@/lib/whatsapp-service-url";

const baseUrl = getWhatsappServiceBaseUrl();
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

// Notify admin about new order, optionally notify customer
export async function notifyNewOrder(params: {
  orderId: string;
  customerName: string;
  amountCents: number;
  customerPhone?: string | null;
}) {
  return whatsappFetch("/notify/new-order", params);
}

// Notify admin about payment approval, optionally notify customer
export async function notifyPaymentApproved(params: {
  orderId: string;
  customerName: string;
  amountCents: number;
  paymentId: string;
  customerPhone?: string | null;
}) {
  return whatsappFetch("/notify/payment-approved", params);
}

// Notify admin about order shipment, optionally notify customer
export async function notifyOrderShipped(params: {
  orderId: string;
  customerName: string;
  trackingCode?: string | null;
  customerPhone?: string | null;
}) {
  return whatsappFetch("/notify/order-shipped", params);
}

// Notify admin about order cancellation, optionally notify customer
export async function notifyOrderCancelled(params: {
  orderId: string;
  customerName: string;
  amountCents?: number;
  customerPhone?: string | null;
}) {
  return whatsappFetch("/notify/order-cancelled", params);
}

// Notify customer that order is being processed
export async function notifyOrderProcessing(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
}) {
  return whatsappFetch("/notify/order-processing", params);
}

// Notify customer that order was delivered
export async function notifyOrderDelivered(params: {
  orderId: string;
  customerName: string;
  customerPhone: string;
}) {
  return whatsappFetch("/notify/order-delivered", params);
}

// Send custom message to customer using template
export async function sendCustomerMessage(params: {
  phone: string;
  templateKey: string;
  variables?: Record<string, string | number>;
}) {
  return whatsappFetch("/messages/send-to-customer", params);
}

// Send custom message to admin using template
export async function sendAdminTemplateMessage(params: {
  templateKey: string;
  variables?: Record<string, string | number>;
}) {
  return whatsappFetch("/messages/send-to-admin", params);
}

// Send custom text message to all admin recipients (legacy)
export async function sendAdminCustomMessage(params: { text: string }) {
  return whatsappFetch("/messages/send", params);
}

// Connection management
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

export async function logoutWhatsapp(): Promise<{ status: string }> {
  const res = await fetch(`${baseUrl}/session/logout`, {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
  if (!res.ok) throw new Error(`WhatsApp logout error ${res.status}`);
  return res.json();
}

// Helper function to safely send WhatsApp to customer (won't throw if phone is missing)
export async function sendCustomerMessageSafe(params: {
  phone?: string | null;
  templateKey: string;
  variables?: Record<string, string | number>;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!params.phone) {
    return { sent: false, reason: "no_phone" };
  }
  try {
    await sendCustomerMessage({
      phone: params.phone,
      templateKey: params.templateKey,
      variables: params.variables,
    });
    return { sent: true };
  } catch (err) {
    console.error("[sendCustomerMessageSafe] failed:", err);
    return { sent: false, reason: "error" };
  }
}