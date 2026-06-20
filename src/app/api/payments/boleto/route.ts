import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, parseBody } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import { createBoletoPayment } from "@/lib/mercadopago";
import { guardCheckoutPayment } from "@/lib/payments/checkout-payment-guard";
import { persistMpPayment } from "@/lib/payments/persist-mp-payment";
import { findReusableBoletoForOrder } from "@/lib/payments/reuse-pending-payment";
import { cpfSchema, orderIdSchema } from "@/lib/validations/ids";

const schema = z.object({
  orderId: orderIdSchema,
  payerEmail: z.string().email(),
  payerCpf: cpfSchema,
  payerName: z.string().min(2),
  reuse: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!(await validateMutationRequest(request))) {
    return jsonError("Invalid request origin", 403);
  }

  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) return jsonError("Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON");
  }

  const parsed = parseBody(schema, body);
  if (!parsed.success) return parsed.response;

  const guard = await guardCheckoutPayment({
    sessionUserId: sessionUser.id,
    orderId: parsed.data.orderId,
    payerEmail: parsed.data.payerEmail,
  });
  if (!guard.ok) return jsonError(guard.error, guard.status);

  if (parsed.data.reuse !== false) {
    const reusable = await findReusableBoletoForOrder(parsed.data.orderId);
    if (reusable) {
      return NextResponse.json({
        paymentId: reusable.paymentId,
        status: reusable.status,
        ticketUrl: reusable.ticketUrl,
        reused: true,
      });
    }
  }

  const cpf = parsed.data.payerCpf.replace(/\D/g, "");

  try {
    const boleto = await createBoletoPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      payerEmail: parsed.data.payerEmail,
      payerCpf: cpf,
      payerName: parsed.data.payerName,
    });

    await persistMpPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      method: "BOLETO",
      mpPaymentId: boleto.id,
      status: boleto.status,
    });

    return NextResponse.json({
      paymentId: boleto.id,
      status: boleto.status,
      ticketUrl: boleto.ticketUrl,
    });
  } catch (e) {
    console.error("[payments/boleto]", e);
    return jsonError("Falha ao gerar boleto", 422);
  }
}
