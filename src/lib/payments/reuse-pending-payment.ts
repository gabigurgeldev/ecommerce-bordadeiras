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

/**
 * A pending order keeps its id while the cart changes, so a stored PENDING
 * payment may be for a stale (cheaper) total. Reusing it would let the customer
 * pay the old amount.
 */
async function findPendingPaymentForOrder(
  orderId: string,
  method: PaymentMethod,
  expectedAmountCents: number,
): Promise<string | null> {
  const { data: payment, error } = await getDb()
    .from(TABLES.Payment)
    .select("mercadoPagoId, amountCents")
    .eq("orderId", orderId)
    .eq("method", method)
    .eq("status", "PENDING")
    .not("mercadoPagoId", "is", null)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[payments] pending payment lookup failed", error);
    return null;
  }

  if (!payment?.mercadoPagoId) return null;
  if (Number(payment.amountCents) !== expectedAmountCents) return null;

  return String(payment.mercadoPagoId);
}

export async function findReusablePixForOrder(
  orderId: string,
  expectedAmountCents: number,
): Promise<ReusablePixPayment | null> {
  const mercadoPagoId = await findPendingPaymentForOrder(
    orderId,
    "PIX" as PaymentMethod,
    expectedAmountCents,
  );
  if (!mercadoPagoId) return null;

  try {
    const mpPayment = await getPaymentById(mercadoPagoId);
    const status = String(mpPayment.status ?? "pending");
    if (status !== "pending") return null;

    const pix = extractPixFromMpPayment(mpPayment);
    if (!pix) return null;

    return {
      paymentId: mercadoPagoId,
      status,
      ...pix,
    };
  } catch (e) {
    // Mercado Pago unreachable: fall through to creating a fresh payment.
    console.error("[payments] pix reuse check failed", e);
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
  expectedAmountCents: number,
): Promise<ReusableBoletoPayment | null> {
  const mercadoPagoId = await findPendingPaymentForOrder(
    orderId,
    "BOLETO" as PaymentMethod,
    expectedAmountCents,
  );
  if (!mercadoPagoId) return null;

  try {
    const mpPayment = await getPaymentById(mercadoPagoId);
    const status = String(mpPayment.status ?? "pending");
    if (status !== "pending") return null;

    const txDetails = mpPayment.transaction_details as
      | { external_resource_url?: string }
      | undefined;

    return {
      paymentId: mercadoPagoId,
      status,
      ticketUrl: txDetails?.external_resource_url,
    };
  } catch (e) {
    // Mercado Pago unreachable: fall through to creating a fresh payment.
    console.error("[payments] boleto reuse check failed", e);
    return null;
  }
}
