import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, parseBody } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import { createPixPayment } from "@/lib/mercadopago";
import { guardCheckoutPayment } from "@/lib/payments/checkout-payment-guard";
import { persistMpPayment } from "@/lib/payments/persist-mp-payment";
import { findReusablePixForOrder } from "@/lib/payments/reuse-pending-payment";
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
    const reusable = await findReusablePixForOrder(parsed.data.orderId);
    if (reusable) {
      return NextResponse.json({
        paymentId: reusable.paymentId,
        status: reusable.status,
        qrCodeBase64: reusable.qrCodeBase64,
        qrCode: reusable.qrCode,
        reused: true,
      });
    }
  }

  const cpf = parsed.data.payerCpf;

  try {
    const pix = await createPixPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      payerEmail: parsed.data.payerEmail,
      payerCpf: cpf,
      payerName: parsed.data.payerName,
    });

    await persistMpPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      method: "PIX",
      mpPaymentId: pix.id,
      status: pix.status,
    });

    return NextResponse.json({
      paymentId: pix.id,
      status: pix.status,
      qrCodeBase64: pix.qrCodeBase64,
      qrCode: pix.qrCode,
      ticketUrl: pix.ticketUrl,
    });
  } catch (e) {
    console.error("[payments/pix]", e);
    return jsonError("Falha ao gerar PIX", 422);
  }
}
