import { getDb, TABLES } from "@/lib/supabase/db";
import type {
  WhatsappDualNotifyResult,
  WhatsappTestAdminResult,
} from "@/lib/whatsapp-notify-types";
import { fetchWhatsappService, fetchWhatsappServiceJson } from "@/lib/whatsapp-fetch";
import { WhatsappServiceError } from "@/lib/whatsapp-fetch";

async function whatsappFetch<T>(path: string, body: Record<string, unknown>) {
  return fetchWhatsappServiceJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

type OrderNotifyBase = {
  orderId: string;
  customerName: string;
  storeName?: string;
  orderDate?: string;
  customerPhone?: string | null;
};

// Notify admin about new order, optionally notify customer
export async function notifyNewOrder(
  params: OrderNotifyBase & { amountCents: number },
): Promise<WhatsappDualNotifyResult> {
  return whatsappFetch("/notify/new-order", params);
}

// Notify admin about payment approval, optionally notify customer
export async function notifyPaymentApproved(
  params: OrderNotifyBase & { amountCents: number; paymentId: string },
): Promise<WhatsappDualNotifyResult> {
  return whatsappFetch("/notify/payment-approved", params);
}

// Notify admin about order shipment, optionally notify customer
export async function notifyOrderShipped(
  params: OrderNotifyBase & { trackingCode?: string | null },
): Promise<WhatsappDualNotifyResult> {
  return whatsappFetch("/notify/order-shipped", params);
}

// Notify admin about order cancellation, optionally notify customer
export async function notifyOrderCancelled(
  params: OrderNotifyBase & { amountCents?: number },
): Promise<WhatsappDualNotifyResult> {
  return whatsappFetch("/notify/order-cancelled", params);
}

export async function sendTestAdminAlert(): Promise<WhatsappTestAdminResult> {
  return whatsappFetch("/messages/send-test-admin", {});
}

// Notify customer that order is being processed
export async function notifyOrderProcessing(params: OrderNotifyBase & { customerPhone: string }) {
  return whatsappFetch("/notify/order-processing", params);
}

// Notify customer that order was delivered
export async function notifyOrderDelivered(params: OrderNotifyBase & { customerPhone: string }) {
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

export async function sendCustomerRawMessage(params: {
  phone: string;
  text: string;
}) {
  return whatsappFetch("/messages/send-to-customer-raw", params);
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
  return fetchWhatsappServiceJson("/session/qr");
}

export async function getWhatsappLiveStatus(): Promise<{ status: string; qr?: string }> {
  return fetchWhatsappServiceJson("/session/status");
}

export async function resolveWhatsappConnectionStatus(): Promise<{
  status: string;
  live: boolean;
  updatedAt?: string | null;
}> {
  try {
    const live = await getWhatsappLiveStatus();
    return { status: live.status, live: true };
  } catch (err) {
    if (!(err instanceof WhatsappServiceError)) {
      console.error("[resolveWhatsappConnectionStatus]", err);
    }
    const { data: session } = await getDb()
      .from(TABLES.WhatsappSession)
      .select("status, updatedAt")
      .eq("sessionId", "default")
      .maybeSingle();
    return {
      status: session?.status != null ? String(session.status) : "disconnected",
      live: false,
      updatedAt: session?.updatedAt != null ? String(session.updatedAt) : null,
    };
  }
}

export async function reconnectWhatsapp(): Promise<{ status: string }> {
  return fetchWhatsappServiceJson("/session/reconnect", { method: "POST" });
}

export async function logoutWhatsapp(): Promise<{ status: string }> {
  return fetchWhatsappServiceJson("/session/logout", { method: "POST" });
}

export async function checkWhatsappServiceHealth(): Promise<{
  ok: boolean;
  connected?: boolean;
  activeRecipients?: number;
}> {
  return fetchWhatsappServiceJson("/health");
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