import { validateMpCredentialPair, verifyAccessTokenMatchesSandbox } from "@/lib/mercadopago-credentials";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { isMpTestUserEmail } from "@/lib/mercadopago-errors";
import { getDb, TABLES } from "@/lib/supabase/db";
import { OrderStatus } from "@/lib/types/database";

export type GuardedCheckoutOrder = {
  id: string;
  userId: string;
  totalCents: number;
  status: string;
  customerEmail: string;
};

export type CheckoutPaymentGuardOk = {
  ok: true;
  order: GuardedCheckoutOrder;
  amountCents: number;
};

export type CheckoutPaymentGuardFail = {
  ok: false;
  error: string;
  status: number;
};

export type CheckoutPaymentGuardResult =
  | CheckoutPaymentGuardOk
  | CheckoutPaymentGuardFail;

export async function guardCheckoutPayment(params: {
  sessionUserId: string;
  orderId: string;
  payerEmail?: string;
}): Promise<CheckoutPaymentGuardResult> {
  const mp = await getMercadoPagoSettingsFromDb();
  
  // Valida credenciais
  const check = validateMpCredentialPair({
    publicKey: mp.publicKey,
    accessToken: mp.accessToken,
  });
  if (!check.valid) {
    return { ok: false, error: check.message, status: 503 };
  }

  const envCheck = await verifyAccessTokenMatchesSandbox(mp.accessToken, mp.sandbox);
  if (!envCheck.ok) {
    return { ok: false, error: envCheck.message, status: 503 };
  }

  const db = getDb();
  const { data: order, error } = await db
    .from(TABLES.Order)
    .select("id, userId, totalCents, status, customerEmail")
    .eq("id", params.orderId)
    .maybeSingle();

  if (error || !order) {
    return { ok: false, error: "Order not found", status: 404 };
  }

  if (String(order.userId) !== params.sessionUserId) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  if (String(order.status) !== OrderStatus.PENDING) {
    return {
      ok: false,
      error: "Este pedido já foi pago ou cancelado",
      status: 409,
    };
  }

  const amountCents = Number(order.totalCents);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Valor do pedido inválido", status: 400 };
  }

  if (mp.sandbox) {
    const email = params.payerEmail?.trim() ?? "";
    if (!isMpTestUserEmail(email)) {
      return {
        ok: false,
        error:
          "Use o e-mail exato de Contas de teste no Mercado Pago (test_user_123456789@testuser.com).",
        status: 422,
      };
    }
  }

  return {
    ok: true,
    order: {
      id: String(order.id),
      userId: String(order.userId),
      totalCents: amountCents,
      status: String(order.status),
      customerEmail: String(order.customerEmail),
    },
    amountCents,
  };
}
