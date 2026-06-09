import { getMercadoPagoSettingsFromDb } from "@/lib/mercadopago-config";

export type PaymentMethodId = "visa" | "master" | "elo" | "hipercard";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodId, string> = {
  visa: "Visa",
  master: "Mastercard",
  elo: "Elo",
  hipercard: "Hipercard",
};

export type InstallmentRateRow = {
  installments: number;
  installmentRate: number;
  totalAmount: number;
  installmentAmount: number;
};

export type InstallmentResult = {
  paymentMethodId: PaymentMethodId;
  paymentMethodLabel: string;
  referenceAmount: number;
  rows: InstallmentRateRow[];
};

export async function fetchMercadoPagoInstallmentRates(
  amountCents: number,
  paymentMethodId: PaymentMethodId = "visa",
): Promise<{ ok: true; result: InstallmentResult } | { ok: false; error: string }> {
  const { accessToken } = await getMercadoPagoSettingsFromDb();
  if (!accessToken) {
    return { ok: false, error: "Access Token não configurado" };
  }

  const amount = amountCents / 100;
  const url = new URL("https://api.mercadopago.com/v1/payment_methods/installments");
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("payment_method_id", paymentMethodId);
  url.searchParams.set("locale", "pt-BR");

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let errorMsg = `Erro ${res.status} ao consultar taxas`;
      try {
        const json = JSON.parse(text) as { message?: string };
        if (json.message) errorMsg = json.message;
      } catch {
        if (text && text.length < 200) errorMsg = text;
      }
      return { ok: false, error: errorMsg };
    }

    const data = (await res.json()) as Array<{
      payer_costs?: Array<{
        installments: number;
        installment_rate: number;
        total_amount: number;
        installment_amount: number;
      }>;
    }>;

    const costs = data[0]?.payer_costs ?? [];
    const rows: InstallmentRateRow[] = costs.map((c) => ({
      installments: c.installments,
      installmentRate: c.installment_rate,
      totalAmount: c.total_amount,
      installmentAmount: c.installment_amount,
    }));

    return {
      ok: true,
      result: {
        paymentMethodId,
        paymentMethodLabel: PAYMENT_METHOD_LABELS[paymentMethodId],
        referenceAmount: amount,
        rows,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao consultar taxas";
    return { ok: false, error: message };
  }
}

export async function fetchMultiplePaymentMethodRates(
  amountCents: number,
  methods: PaymentMethodId[] = ["visa", "master", "elo"],
): Promise<{
  results: InstallmentResult[];
  errors: Array<{ paymentMethodId: PaymentMethodId; error: string }>;
}> {
  const settled = await Promise.allSettled(
    methods.map((m) => fetchMercadoPagoInstallmentRates(amountCents, m)),
  );

  const results: InstallmentResult[] = [];
  const errors: Array<{ paymentMethodId: PaymentMethodId; error: string }> = [];

  settled.forEach((s, i) => {
    const methodId = methods[i];
    if (s.status === "fulfilled") {
      if (s.value.ok) {
        results.push(s.value.result);
      } else {
        errors.push({ paymentMethodId: methodId, error: s.value.error });
      }
    } else {
      errors.push({ paymentMethodId: methodId, error: String(s.reason) });
    }
  });

  return { results, errors };
}
