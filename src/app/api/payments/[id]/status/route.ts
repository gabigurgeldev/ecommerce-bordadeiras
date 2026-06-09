import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/api-utils";
import { getPaymentById } from "@/lib/mercadopago";
import { syncMpPaymentStatus } from "@/lib/payments/persist-mp-payment";
import { getDb, TABLES } from "@/lib/supabase/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) return jsonError("Unauthorized", 401);

  const { id: mpPaymentId } = await params;

  const db = getDb();
  const { data: payment } = await db
    .from(TABLES.Payment)
    .select("orderId, mercadoPagoId")
    .eq("mercadoPagoId", mpPaymentId)
    .maybeSingle();

  if (!payment) return jsonError("Payment not found", 404);

  const { data: order } = await db
    .from(TABLES.Order)
    .select("userId")
    .eq("id", payment.orderId)
    .maybeSingle();

  if (!order || String(order.userId) !== sessionUser.id) {
    return jsonError("Forbidden", 403);
  }

  try {
    const mpPayment = await getPaymentById(mpPaymentId);
    const status = String(mpPayment.status ?? "pending");

    await syncMpPaymentStatus({
      orderId: String(payment.orderId),
      mpPaymentId,
      status,
    });

    return NextResponse.json({
      status,
      paymentId: mpPaymentId,
      statusDetail: mpPayment.status_detail ?? null,
    });
  } catch (e) {
    console.error("[payments/status]", e);
    return jsonError(
      e instanceof Error ? e.message : "Falha ao consultar pagamento",
      422,
    );
  }
}
