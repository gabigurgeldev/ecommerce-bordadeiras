import { getAppOrigin, resolveMercadoPagoNotificationUrl } from "@/lib/app-url";
import { mpIdempotencyKey } from "@/lib/payments/mp-idempotency";
import {
  mapMercadoPagoApiError,
  validateMpCredentialPair,
  verifyAccessTokenMatchesSandbox,
} from "@/lib/mercadopago-credentials";
import {
  isMpTestUserEmail,
  MP_SANDBOX_TEST_CPF,
  parseMpApiErrorPayload,
} from "@/lib/mercadopago-errors";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import type { PaymentMethod } from "@/lib/types/database";
import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";

async function getValidatedMercadoPagoSettings() {
  const settings = await getMercadoPagoSettingsFromDb();
  const check = validateMpCredentialPair({
    publicKey: settings.publicKey,
    accessToken: settings.accessToken,
  });
  if (!check.valid) {
    throw new Error(check.message);
  }

  const envCheck = await verifyAccessTokenMatchesSandbox(
    settings.accessToken,
    settings.sandbox,
  );
  if (!envCheck.ok) {
    throw new Error(envCheck.message);
  }

  return settings;
}

export async function getMercadoPagoClient(): Promise<MercadoPagoConfig> {
  const { accessToken } = await getValidatedMercadoPagoSettings();
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
  const baseUrl = getAppOrigin();
  const notificationUrl = resolveMercadoPagoNotificationUrl();
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
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
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
  const id = String(paymentId);
  if (id.startsWith("ORD")) {
    return getOrderAsPayment(id);
  }
  const mp = await getMercadoPagoClient();
  const payment = new Payment(mp);
  return payment.get({ id });
}

type MpOrderPaymentMethod = {
  id?: string;
  type?: string;
  ticket_url?: string;
  qr_code?: string;
  qr_code_base64?: string;
};

type MpOrderPayment = {
  id?: string;
  status?: string;
  status_detail?: string;
  amount?: string | number;
  payment_method?: MpOrderPaymentMethod;
};

type MpOrderResponse = {
  id?: string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  total_amount?: string | number;
  transactions?: { payments?: MpOrderPayment[] };
};

function mapOrderStatusToPaymentStatus(
  paymentStatus?: string,
  orderStatus?: string,
): string {
  const status = paymentStatus ?? orderStatus ?? "pending";
  if (status === "processed" || status === "accredited") return "approved";
  if (status === "action_required" || status === "waiting_transfer") return "pending";
  if (status === "cancelled" || status === "rejected") return "rejected";
  return status;
}

async function fetchMpOrder(orderId: string): Promise<MpOrderResponse> {
  const settings = await getValidatedMercadoPagoSettings();
  const res = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${settings.accessToken}` },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const raw = parseMpApiErrorPayload(payload, res.status);
    throw new Error(mapMercadoPagoApiError(raw, settings.sandbox));
  }

  return payload as MpOrderResponse;
}

async function getOrderAsPayment(orderId: string) {
  const order = await fetchMpOrder(orderId);
  const payment = order.transactions?.payments?.[0];
  const pm = payment?.payment_method;
  const status = mapOrderStatusToPaymentStatus(payment?.status, order.status);

  const rawAmount = payment?.amount ?? order.total_amount;
  const parsedAmount = rawAmount != null && rawAmount !== "" ? Number(rawAmount) : undefined;
  const transaction_amount =
    parsedAmount != null && Number.isFinite(parsedAmount) ? parsedAmount : undefined;

  return {
    id: payment?.id ?? orderId,
    status,
    status_detail: payment?.status_detail ?? order.status_detail,
    external_reference: order.external_reference,
    transaction_amount,
    payment_method_id: pm?.id,
    point_of_interaction: pm?.qr_code
      ? {
          transaction_data: {
            qr_code: pm.qr_code,
            qr_code_base64: pm.qr_code_base64,
            ticket_url: pm.ticket_url,
          },
        }
      : undefined,
    transaction_details: pm?.ticket_url
      ? { external_resource_url: pm.ticket_url }
      : undefined,
  };
}

async function createMpOrder(
  orderId: string,
  methodKey: string,
  body: Record<string, unknown>,
  idempotencySuffix?: string,
) {
  const settings = await getValidatedMercadoPagoSettings();
  const idempotencyKey = mpIdempotencyKey(orderId, methodKey, idempotencySuffix);

  const res = await fetch("https://api.mercadopago.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const raw = parseMpApiErrorPayload(payload, res.status);
    console.error("[mercadopago] order create failed", {
      status: res.status,
      sandbox: settings.sandbox,
      raw,
      payload,
    });
    throw new Error(mapMercadoPagoApiError(raw, settings.sandbox));
  }

  return payload as MpOrderResponse;
}

export type BrickPaymentFormData = {
  token?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  installments?: number | string;
  issuer_id?: string | number;
  payer?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    identification?: { type?: string; number?: string };
  };
};

function buildOrderPayerFromBrick(
  payerEmail: string,
  formData: BrickPaymentFormData & Record<string, unknown>,
  payerCpf?: string,
  sandbox = false,
): Record<string, unknown> {
  const formPayer = formData.payer;
  const cardholderRaw =
    (typeof formData.cardholderName === "string" && formData.cardholderName.trim()) ||
    (typeof formData.cardholder_name === "string" && formData.cardholder_name.trim()) ||
    [formPayer?.first_name, formPayer?.last_name].filter(Boolean).join(" ") ||
    "";
  const { firstName, lastName } = splitPayerName(cardholderRaw);

  const identification =
    formPayer?.identification ??
    (payerCpf ? { type: "CPF", number: payerCpf.replace(/\D/g, "") } : undefined);

  const email = sandbox ? payerEmail.trim().toLowerCase() : payerEmail.trim();

  return {
    email,
    entity_type: "individual",
    first_name: firstName,
    last_name: lastName,
    ...(identification ? { identification } : {}),
  };
}

function splitPayerName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Cliente", lastName: "Loja" };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function buildDirectPayer(
  input: {
    payerEmail: string;
    payerCpf: string;
    payerName?: string;
  },
  sandbox = false,
): Record<string, unknown> {
  const cpf = sandbox ? MP_SANDBOX_TEST_CPF : input.payerCpf.replace(/\D/g, "");
  const { firstName, lastName } = splitPayerName(input.payerName ?? "");
  const email = sandbox
    ? input.payerEmail.trim().toLowerCase()
    : input.payerEmail.trim();
  return {
    email,
    entity_type: "individual",
    first_name: firstName,
    last_name: lastName,
    identification: { type: "CPF", number: cpf },
  };
}

function appendNotificationUrl(body: Record<string, unknown>) {
  const notificationUrl = resolveMercadoPagoNotificationUrl();
  if (notificationUrl) {
    body.notification_url = notificationUrl;
  }
}

function formatMpApiError(e: unknown, sandbox?: boolean): string {
  let raw = "Falha ao processar pagamento no Mercado Pago";
  if (e && typeof e === "object") {
    const err = e as {
      message?: string;
      cause?: Array<{ code?: string; description?: string }>;
    };
    const details = err.cause
      ?.map((c) => c.description ?? c.code)
      .filter(Boolean)
      .join("; ");
    raw = details || err.message || raw;
  } else if (e instanceof Error) {
    raw = e.message;
  }

  return mapMercadoPagoApiError(raw, sandbox);
}

async function createMpPayment(
  orderId: string,
  method: string,
  body: Record<string, unknown>,
) {
  const settings = await getValidatedMercadoPagoSettings();
  const idempotencyKey = mpIdempotencyKey(orderId, method);

  const res = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const raw = parseMpApiErrorPayload(payload, res.status);
    console.error("[mercadopago] payment create failed", {
      status: res.status,
      sandbox: settings.sandbox,
      raw,
      payload,
    });
    throw new Error(mapMercadoPagoApiError(raw, settings.sandbox));
  }

  return payload as Awaited<ReturnType<Payment["create"]>>;
}

export type PixPaymentResult = {
  id: number | string;
  status: string;
  qrCodeBase64: string;
  qrCode: string;
  ticketUrl?: string;
};

export type BoletoPaymentResult = {
  id: number | string;
  status: string;
  ticketUrl?: string;
  barcode?: string;
};

export async function createPixPayment(input: {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  payerCpf: string;
  payerName?: string;
}): Promise<PixPaymentResult> {
  const settings = await getValidatedMercadoPagoSettings();
  if (settings.sandbox && !isMpTestUserEmail(input.payerEmail)) {
    throw new Error(
      "Use o e-mail exato de Contas de teste no Mercado Pago (test_user_123456789@testuser.com).",
    );
  }

  const amount = (input.amountCents / 100).toFixed(2);
  const { firstName, lastName } = splitPayerName(input.payerName ?? "");
  const email = settings.sandbox
    ? input.payerEmail.trim().toLowerCase()
    : input.payerEmail.trim();

  const body: Record<string, unknown> = {
    type: "online",
    processing_mode: "automatic",
    external_reference: input.orderId,
    total_amount: amount,
    payer: {
      email,
      entity_type: "individual",
      first_name: firstName,
      last_name: lastName,
    },
    transactions: {
      payments: [
        {
          amount,
          payment_method: { id: "pix", type: "bank_transfer" },
        },
      ],
    },
  };

  const order = await createMpOrder(input.orderId, "pix-order", body);
  const payment = order.transactions?.payments?.[0];
  const pm = payment?.payment_method;

  if (!pm?.qr_code || !pm?.qr_code_base64) {
    throw new Error("Mercado Pago não retornou dados do PIX");
  }

  const status = mapOrderStatusToPaymentStatus(payment?.status, order.status);

  return {
    id: order.id ?? payment?.id ?? "",
    status,
    qrCodeBase64: pm.qr_code_base64,
    qrCode: pm.qr_code,
    ticketUrl: pm.ticket_url,
  };
}

export async function createBoletoPayment(input: {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  payerCpf: string;
  payerName?: string;
}): Promise<BoletoPaymentResult> {
  const settings = await getValidatedMercadoPagoSettings();
  if (settings.sandbox && !isMpTestUserEmail(input.payerEmail)) {
    throw new Error(
      "Use o e-mail exato de Contas de teste no Mercado Pago (test_user_123456789@testuser.com).",
    );
  }
  const amount = input.amountCents / 100;
  const body: Record<string, unknown> = {
    transaction_amount: amount,
    description: `Pedido ${input.orderId}`,
    payment_method_id: "bolbradesco",
    payer: buildDirectPayer(input, settings.sandbox),
    external_reference: input.orderId,
  };
  appendNotificationUrl(body);

  const result = await createMpPayment(input.orderId, "boleto", body);
  const txDetails = result.transaction_details as
    | { external_resource_url?: string }
    | undefined;

  return {
    id: result.id ?? "",
    status: String(result.status ?? "pending"),
    ticketUrl: txDetails?.external_resource_url,
    barcode: undefined,
  };
}

export async function createBrickPayment(input: {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  payerCpf?: string;
  formData: BrickPaymentFormData;
}) {
  const settings = await getValidatedMercadoPagoSettings();
  if (settings.sandbox && !isMpTestUserEmail(input.payerEmail)) {
    throw new Error(
      "Use o e-mail exato de Contas de teste no Mercado Pago (test_user_123456789@testuser.com).",
    );
  }

  const paymentMethodId = input.formData.payment_method_id;
  if (!paymentMethodId) {
    throw new Error("Método de pagamento não informado pelo formulário");
  }
  if (!input.formData.token) {
    throw new Error("Token do cartão não informado. Tente novamente.");
  }

  const amount = (input.amountCents / 100).toFixed(2);
  const paymentType =
    input.formData.payment_type_id === "debit_card" ? "debit_card" : "credit_card";
  const payer = buildOrderPayerFromBrick(
    input.payerEmail,
    input.formData as BrickPaymentFormData & Record<string, unknown>,
    input.payerCpf,
    settings.sandbox,
  );

  const body: Record<string, unknown> = {
    type: "online",
    processing_mode: "automatic",
    external_reference: input.orderId,
    total_amount: amount,
    payer,
    transactions: {
      payments: [
        {
          amount,
          payment_method: {
            id: paymentMethodId,
            type: paymentType,
            token: input.formData.token,
            installments: Number(input.formData.installments) || 1,
          },
        },
      ],
    },
  };

  const order = await createMpOrder(
    input.orderId,
    `card-${paymentMethodId}`,
    body,
    input.formData.token.slice(-20),
  );
  const payment = order.transactions?.payments?.[0];
  const status = mapOrderStatusToPaymentStatus(payment?.status, order.status);

  return {
    id: order.id ?? payment?.id ?? "",
    status,
    status_detail: payment?.status_detail ?? order.status_detail,
    external_reference: order.external_reference,
  };
}

async function mpFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { accessToken } = await getValidatedMercadoPagoSettings();
  if (!accessToken) {
    throw new Error("Mercado Pago não configurado");
  }
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[mercadopago] API request failed", {
      path,
      status: res.status,
      body: err,
    });
    throw new Error("Falha ao consultar Mercado Pago");
  }
  return res.json() as Promise<T>;
}

export type MpCustomer = { id: string; email: string };

export async function createMpCustomer(
  email: string,
): Promise<MpCustomer> {
  return mpFetch<MpCustomer>("/v1/customers", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function getMpCustomer(
  customerId: string,
): Promise<MpCustomer & { cards?: MpCard[] }> {
  return mpFetch(`/v1/customers/${customerId}`);
}

export type MpCard = {
  id: string;
  last_four_digits?: string;
  payment_method?: { id: string; name: string };
  expiration_month?: number;
  expiration_year?: number;
};

export async function listMpCustomerCards(
  customerId: string,
): Promise<MpCard[]> {
  const data = await mpFetch<{ data?: MpCard[] } | MpCard[]>(
    `/v1/customers/${customerId}/cards`,
  );
  if (Array.isArray(data)) return data;
  return data.data ?? [];
}

export async function saveMpCard(
  customerId: string,
  token: string,
): Promise<MpCard> {
  return mpFetch<MpCard>(`/v1/customers/${customerId}/cards`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function deleteMpCard(
  customerId: string,
  cardId: string,
): Promise<void> {
  await mpFetch(`/v1/customers/${customerId}/cards/${cardId}`, {
    method: "DELETE",
  });
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

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return false;
  const timestampMs = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  const maxSkewMs = 5 * 60 * 1000;
  if (Math.abs(Date.now() - timestampMs) > maxSkewMs) return false;

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
    const received = Buffer.from(hash, "hex");
    const expected = Buffer.from(computed, "hex");
    if (received.length !== expected.length) return false;
    return timingSafeEqual(received, expected);
  } catch {
    return false;
  }
}
