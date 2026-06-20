import type { JsonValue } from "@/lib/types/database";

type JsonObject = { [key: string]: JsonValue };

function scalar(value: unknown): JsonValue | undefined {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  return undefined;
}

function pickScalars(
  source: Record<string, unknown>,
  keys: string[],
): JsonObject {
  const out: JsonObject = {};
  for (const key of keys) {
    const value = scalar(source[key]);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function sanitizeMercadoPagoPaymentMetadata(input: unknown): JsonObject {
  if (!input || typeof input !== "object") {
    return { provider: "mercadopago" };
  }

  const payment = input as Record<string, unknown>;
  const metadata: JsonObject = {
    provider: "mercadopago",
    ...pickScalars(payment, [
      "id",
      "status",
      "status_detail",
      "external_reference",
      "transaction_amount",
      "currency_id",
      "payment_method_id",
      "payment_type_id",
      "date_created",
      "date_approved",
      "date_last_updated",
    ]),
  };

  const transactionDetails = payment.transaction_details;
  if (transactionDetails && typeof transactionDetails === "object") {
    const details = pickScalars(transactionDetails as Record<string, unknown>, [
      "net_received_amount",
      "total_paid_amount",
      "installment_amount",
    ]);
    if (Object.keys(details).length > 0) {
      metadata.transaction_details = details;
    }
  }

  return metadata;
}
