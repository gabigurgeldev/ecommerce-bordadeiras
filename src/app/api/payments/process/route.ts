import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { jsonError, parseBody } from "@/lib/api-utils";
import { validateMutationRequest } from "@/lib/csrf";
import {
  mapToDbPaymentMethod,
  resolveMethodFromFormData,
  validatePaymentSubmission,
} from "@/lib/checkout-payment-methods";
import { createBrickPayment } from "@/lib/mercadopago";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";
import { guardCheckoutPayment } from "@/lib/payments/checkout-payment-guard";
import { persistMpPayment } from "@/lib/payments/persist-mp-payment";
import { orderIdSchema } from "@/lib/validations/ids";

const schema = z.object({
  orderId: orderIdSchema,
  formData: z.record(z.string(), z.unknown()),
  selectedMethod: z
    .enum(["pix", "credit_card", "debit_card", "boleto"])
    .optional(),
  payerCpf: z.string().optional(),
  payerEmail: z.string().email().optional(),
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

  const payerEmail =
    parsed.data.payerEmail ??
    (typeof parsed.data.formData.payer === "object" &&
    parsed.data.formData.payer &&
    typeof (parsed.data.formData.payer as { email?: string }).email === "string"
      ? (parsed.data.formData.payer as { email: string }).email
      : undefined);

  const guard = await guardCheckoutPayment({
    sessionUserId: sessionUser.id,
    orderId: parsed.data.orderId,
    payerEmail,
  });
  if (!guard.ok) return jsonError(guard.error, guard.status);

  const mpSettings = await getMercadoPagoSettingsFromDb();
  const validation = validatePaymentSubmission(
    parsed.data.formData,
    mpSettings.enabledMethods,
    mpSettings.maxInstallments,
  );

  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }

  const resolvedMethod = resolveMethodFromFormData(parsed.data.formData);
  if (
    parsed.data.selectedMethod &&
    resolvedMethod &&
    parsed.data.selectedMethod !== resolvedMethod
  ) {
    return jsonError("Método de pagamento não corresponde à seleção", 400);
  }

  try {
    const mpPayment = await createBrickPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      payerEmail: payerEmail ?? guard.order.customerEmail,
      payerCpf: parsed.data.payerCpf,
      formData: parsed.data.formData as Parameters<
        typeof createBrickPayment
      >[0]["formData"],
    });

    const status = String(mpPayment.status ?? "pending");
    const dbMethod = mapToDbPaymentMethod(parsed.data.formData);

    const { localPaymentId } = await persistMpPayment({
      orderId: guard.order.id,
      amountCents: guard.amountCents,
      method: dbMethod,
      mpPaymentId: mpPayment.id ?? "",
      status,
    });

    return NextResponse.json({
      status,
      paymentId: mpPayment.id,
      localPaymentId,
      paymentType: resolvedMethod,
    });
  } catch (e) {
    console.error("[payments/process]", e);
    return jsonError("Falha ao processar pagamento", 422);
  }
}
