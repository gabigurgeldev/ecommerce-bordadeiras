import { getPaymentById } from "@/lib/mercadopago";
import type { PaymentMethod } from "@/lib/types/database";
import { getDb, TABLES } from "@/lib/supabase/db";

export type ReusablePixPayment = {
  paymentId: string;
  status: string;
  qrCodeBase64: string;
  qrCode: string;
};

function extractPixFromMpPayment(mpPayment: Awaited<ReturnType<typeof getPaymentById>>) {
  const poi = mpPayment.point_of_interaction as
    | {
        transaction_data?: {
          qr_code_base64?: string;
          qr_code?: string;
        };
      }
    | undefined;
  const tx = poi?.transaction_data;
  if (!tx?.qr_code_base64 || !tx?.qr_code) return null;
  return {
    qrCodeBase64: tx.qr_code_base64,
    qrCode: tx.qr_code,
  };
}

export async function findReusablePixForOrder(
  orderId: string,
): Promise<ReusablePixPayment | null> {
  const db = getDb();
  const { data: payment } = await db
    .from(TABLES.Payment)
    .select("mercadoPagoId, status")
    .eq("orderId", orderId)
    .eq("method", "PIX" as PaymentMethod)
    .eq("status", "PENDING")
    .not("mercadoPagoId", "is", null)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.mercadoPagoId) return null;

  try {
    const mpPayment = await getPaymentById(String(payment.mercadoPagoId));
    const status = String(mpPayment.status ?? "pending");
    if (status !== "pending") return null;

    const pix = extractPixFromMpPayment(mpPayment);
    if (!pix) return null;

    return {
      paymentId: String(payment.mercadoPagoId),
      status,
      ...pix,
    };
  } catch {
    return null;
  }
}

export type ReusableBoletoPayment = {
  paymentId: string;
  status: string;
  ticketUrl?: string;
};

export async function findReusableBoletoForOrder(
  orderId: string,
): Promise<ReusableBoletoPayment | null> {
  const db = getDb();
  const { data: payment } = await db
    .from(TABLES.Payment)
    .select("mercadoPagoId, status")
    .eq("orderId", orderId)
    .eq("method", "BOLETO" as PaymentMethod)
    .eq("status", "PENDING")
    .not("mercadoPagoId", "is", null)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment?.mercadoPagoId) return null;

  try {
    const mpPayment = await getPaymentById(String(payment.mercadoPagoId));
    const status = String(mpPayment.status ?? "pending");
    if (status !== "pending") return null;

    const txDetails = mpPayment.transaction_details as
      | { external_resource_url?: string }
      | undefined;

    return {
      paymentId: String(payment.mercadoPagoId),
      status,
      ticketUrl: txDetails?.external_resource_url,
    };
  } catch {
    return null;
  }
}
