import { describe, expect, it } from "vitest";
import {
  brickConfigForMethod,
  buildAvailableMethods,
  cardBrickExcludedTypes,
  resolveMethodFromFormData,
  validatePaymentSubmission,
} from "./checkout-payment-methods";

describe("checkout-payment-methods", () => {
  const enabled = {
    pix: true,
    credit_card: true,
    debit_card: false,
    boleto: true,
  };

  it("buildAvailableMethods respects admin toggles", () => {
    const methods = buildAvailableMethods(enabled, 6, "buyer");
    expect(methods.map((m) => m.id)).toEqual(["pix", "credit_card", "boleto"]);
  });

  it("brickConfigForMethod exposes only selected method keys", () => {
    const pix = brickConfigForMethod("pix", 12);
    expect(pix.bankTransfer).toBe("all");
    expect(pix.creditCard).toBeUndefined();
    expect(pix.debitCard).toBeUndefined();

    const credit = brickConfigForMethod("credit_card", 6);
    expect(credit.creditCard).toBe("all");
    expect(credit.bankTransfer).toBeUndefined();
    expect(credit.maxInstallments).toBe(6);

    const debit = brickConfigForMethod("debit_card", 12);
    expect(debit.debitCard).toBe("all");
    expect(debit.creditCard).toBeUndefined();
  });

  it("resolveMethodFromFormData detects pix and debit", () => {
    expect(
      resolveMethodFromFormData({
        payment_type_id: "bank_transfer",
        payment_method_id: "pix",
      }),
    ).toBe("pix");
    expect(
      resolveMethodFromFormData({
        payment_type_id: "debit_card",
        payment_method_id: "debvisa",
      }),
    ).toBe("debit_card");
  });

  it("validatePaymentSubmission rejects disabled methods", () => {
    const result = validatePaymentSubmission(
      { payment_type_id: "debit_card" },
      enabled,
      12,
    );
    expect(result.ok).toBe(false);
  });

  it("cardBrickExcludedTypes limits card form to credit or debit", () => {
    expect(cardBrickExcludedTypes("credit_card")).toEqual([
      "debit_card",
      "prepaid_card",
    ]);
    expect(cardBrickExcludedTypes("debit_card")).toEqual([
      "credit_card",
      "prepaid_card",
    ]);
  });

  it("validatePaymentSubmission enforces max installments", () => {
    const result = validatePaymentSubmission(
      { payment_type_id: "credit_card", installments: 10 },
      enabled,
      3,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("3");
    }
  });
});
