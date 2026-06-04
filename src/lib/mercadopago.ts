import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { PaymentMethod } from "@/lib/types/database";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";

export async function getMercadoPagoClient(): Promise<MercadoPagoConfig> {
  const { accessToken } = await getMercadoPagoSettingsFromDb();
  if (!accessToken) {
    throw new Error("Mercado Pago is not configured. Set credentials in Admin → Configurações.");
  }
  return new MercadoPagoConfig({ accessToken });
}

export type CreatePreferenceInput = {
  orderId: string;
  title: string;
  amountCents: number;
  payerEmail: string;
  method: PaymentMethod;
};

export async function createPaymentPreference(input: CreatePreferenceInput) {
  const mp = await getMercadoPagoClient();
  const preference = new Preference(mp);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amount = input.amountCents / 100;

  const paymentMethods: {
    excluded_payment_types?: { id: string }[];
    default_payment_method_id?: string;
  } = {};

  if (input.method === "PIX") {
    paymentMethods.excluded_payment_types = [
      { id: "credit_card" },
      { id: "debit_card" },
      { id: "ticket" },
    ];
  } else if (input.method === "CREDIT_CARD") {
    paymentMethods.excluded_payment_types = [{ id: "ticket" }];
  } else if (input.method === "BOLETO") {
    paymentMethods.excluded_payment_types = [
      { id: "credit_card" },
      { id: "debit_card" },
    ];
    paymentMethods.default_payment_method_id = "bolbradesco";
  }

  const result = await preference.create({
    body: {
      items: [
        {
          id: input.orderId,
          title: input.title,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: { email: input.payerEmail },
      external_reference: input.orderId,
      notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${baseUrl}/checkout/success?order=${input.orderId}`,
        failure: `${baseUrl}/checkout/failure?order=${input.orderId}`,
        pending: `${baseUrl}/checkout/pending?order=${input.orderId}`,
      },
      auto_return: "approved",
      payment_methods: paymentMethods,
    },
  });

  return result;
}

export async function getPaymentById(paymentId: string | number) {
  const mp = await getMercadoPagoClient();
  const payment = new Payment(mp);
  return payment.get({ id: String(paymentId) });
}

export async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  secret: string
): Promise<boolean> {
  const xSignature = headers.get("x-signature");
  const xRequestId = headers.get("x-request-id");
  if (!xSignature || !secret) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim()];
    })
  );

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const dataId =
    headers.get("x-resource-id") ??
    (() => {
      try {
        const parsed = JSON.parse(body) as { data?: { id?: string } };
        return parsed.data?.id ?? "";
      } catch {
        return "";
      }
    })();

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const computed = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(computed));
  } catch {
    return hash === computed;
  }
}
