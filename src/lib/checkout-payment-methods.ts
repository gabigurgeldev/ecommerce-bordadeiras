import type { MercadoPagoEnabledMethods } from "@/lib/mercadopago-config";
import type { PaymentMethod } from "@/lib/types/database";

export type CheckoutPaymentMethodId =
  | "pix"
  | "credit_card"
  | "debit_card"
  | "boleto";

export type CheckoutPaymentMethodOption = {
  id: CheckoutPaymentMethodId;
  label: string;
  description: string;
  iconSrc: string;
};

export const CHECKOUT_PAYMENT_METHOD_ICONS: Record<
  CheckoutPaymentMethodId,
  string
> = {
  pix: "/payment-methods/pix.svg",
  credit_card: "/payment-methods/credit-card.svg",
  debit_card: "/payment-methods/debit-card.svg",
  boleto: "/payment-methods/boleto.svg",
};

/** MP Brick: omit keys to disable a type — never use "none". */
export type BrickPaymentMethodsConfig = {
  maxInstallments: number;
  creditCard?: "all";
  debitCard?: "all";
  bankTransfer?: "all";
  ticket?: "all";
};

const METHOD_ORDER: CheckoutPaymentMethodId[] = [
  "pix",
  "credit_card",
  "debit_card",
  "boleto",
];

const METHOD_META: Record<
  CheckoutPaymentMethodId,
  Omit<CheckoutPaymentMethodOption, "id" | "description"> & {
    description: (ctx: {
      maxInstallments: number;
      installmentFees: "merchant" | "buyer";
    }) => string;
  }
> = {
  pix: {
    label: "PIX",
    iconSrc: CHECKOUT_PAYMENT_METHOD_ICONS.pix,
    description: () => "Aprovação instantânea",
  },
  credit_card: {
    label: "Cartão de crédito",
    iconSrc: CHECKOUT_PAYMENT_METHOD_ICONS.credit_card,
    description: ({ maxInstallments, installmentFees }) =>
      installmentFees === "merchant"
        ? `Até ${maxInstallments}x — juros absorvidos pela loja`
        : `Até ${maxInstallments}x — parcelas conforme bandeira`,
  },
  debit_card: {
    label: "Cartão de débito",
    iconSrc: CHECKOUT_PAYMENT_METHOD_ICONS.debit_card,
    description: () => "Débito à vista",
  },
  boleto: {
    label: "Boleto bancário",
    iconSrc: CHECKOUT_PAYMENT_METHOD_ICONS.boleto,
    description: () => "Vencimento em até 3 dias úteis",
  },
};

const ENABLED_KEY: Record<
  CheckoutPaymentMethodId,
  keyof MercadoPagoEnabledMethods
> = {
  pix: "pix",
  credit_card: "credit_card",
  debit_card: "debit_card",
  boleto: "boleto",
};

export function buildAvailableMethods(
  enabledMethods: MercadoPagoEnabledMethods,
  maxInstallments: number,
  installmentFees: "merchant" | "buyer",
): CheckoutPaymentMethodOption[] {
  return METHOD_ORDER.filter((id) => enabledMethods[ENABLED_KEY[id]]).map(
    (id) => ({
      id,
      label: METHOD_META[id].label,
      iconSrc: METHOD_META[id].iconSrc,
      description: METHOD_META[id].description({ maxInstallments, installmentFees }),
    }),
  );
}

export function getDefaultSelectedMethod(
  enabledMethods: MercadoPagoEnabledMethods,
): CheckoutPaymentMethodId | null {
  const available = METHOD_ORDER.filter((id) => enabledMethods[ENABLED_KEY[id]]);
  return available[0] ?? null;
}

/** Card Payment Brick: exclude other card types so only credit OR debit shows. */
export function cardBrickExcludedTypes(
  method: Extract<CheckoutPaymentMethodId, "credit_card" | "debit_card">,
): Array<"credit_card" | "debit_card" | "prepaid_card"> {
  if (method === "credit_card") {
    return ["debit_card", "prepaid_card"];
  }
  return ["credit_card", "prepaid_card"];
}

export function brickConfigForMethod(
  selectedMethod: CheckoutPaymentMethodId,
  maxInstallments: number,
): BrickPaymentMethodsConfig {
  switch (selectedMethod) {
    case "pix":
      return { bankTransfer: "all", maxInstallments: 1 };
    case "credit_card":
      return { creditCard: "all", maxInstallments };
    case "debit_card":
      return { debitCard: "all", maxInstallments: 1 };
    case "boleto":
      return { ticket: "all", maxInstallments: 1 };
  }
}

export function installmentHint(
  installmentFees: "merchant" | "buyer",
  maxInstallments: number,
  selectedMethod: CheckoutPaymentMethodId,
): string | null {
  if (selectedMethod !== "credit_card") return null;
  return installmentFees === "merchant"
    ? `Parcelamento em até ${maxInstallments}x. Juros absorvidos pela loja conforme configuração do Mercado Pago.`
    : `Parcelamento em até ${maxInstallments}x. Juros conforme bandeira do cartão.`;
}

/** Maps Brick formData to our checkout method id. */
export function resolveMethodFromFormData(
  formData: Record<string, unknown>,
): CheckoutPaymentMethodId | null {
  const typeId = String(formData.payment_type_id ?? "").toLowerCase();

  if (typeId === "bank_transfer" || typeId.includes("pix")) return "pix";
  if (typeId === "debit_card") return "debit_card";
  if (typeId === "ticket") return "boleto";
  if (typeId === "credit_card") return "credit_card";

  const methodId = String(formData.payment_method_id ?? "").toLowerCase();
  if (!methodId) return null;

  if (methodId.includes("pix")) return "pix";
  if (methodId.includes("bol") || methodId.includes("ticket")) return "boleto";
  if (methodId.startsWith("deb") || methodId.includes("debit")) {
    return "debit_card";
  }

  return "credit_card";
}

export function isMethodEnabledForCheckout(
  method: CheckoutPaymentMethodId | null,
  enabledMethods: MercadoPagoEnabledMethods,
): boolean {
  if (!method) return false;
  return enabledMethods[ENABLED_KEY[method]];
}

export function validatePaymentSubmission(
  formData: Record<string, unknown>,
  enabledMethods: MercadoPagoEnabledMethods,
  maxInstallments: number,
): { ok: true } | { ok: false; error: string } {
  const method = resolveMethodFromFormData(formData);

  if (!method) {
    return { ok: false, error: "Método de pagamento não identificado" };
  }

  if (!isMethodEnabledForCheckout(method, enabledMethods)) {
    return { ok: false, error: "Forma de pagamento não disponível" };
  }

  if (method === "credit_card") {
    const installments = Number(formData.installments) || 1;
    if (installments > maxInstallments) {
      return {
        ok: false,
        error: `Parcelamento máximo permitido: ${maxInstallments}x`,
      };
    }
    if (installments < 1) {
      return { ok: false, error: "Número de parcelas inválido" };
    }
  }

  return { ok: true };
}

/** Maps to DB PaymentMethod enum (no DEBIT_CARD in schema — debit stored as CREDIT_CARD). */
export function mapToDbPaymentMethod(
  formData: Record<string, unknown>,
): PaymentMethod {
  const method = resolveMethodFromFormData(formData);
  if (method === "pix") return "PIX";
  if (method === "boleto") return "BOLETO";
  return "CREDIT_CARD";
}

export function isDebitPayment(formData: Record<string, unknown>): boolean {
  return resolveMethodFromFormData(formData) === "debit_card";
}
