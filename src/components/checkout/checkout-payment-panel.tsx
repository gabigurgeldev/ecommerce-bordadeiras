"use client";

import { CheckoutBoletoPanel } from "@/components/checkout/checkout-boleto-panel";
import { CheckoutCardPaymentBrick } from "@/components/checkout/checkout-card-payment-brick";
import { CheckoutPixPanel } from "@/components/checkout/checkout-pix-panel";
import type { CheckoutPaymentMethodId } from "@/lib/checkout-payment-methods";

export function CheckoutPaymentPanel({
  publicKey,
  amountCents,
  orderId,
  payerEmail,
  payerName,
  payerCpf,
  selectedMethod,
  maxInstallments,
  installmentFees,
  sandbox,
  onPaymentComplete,
}: {
  publicKey: string | null;
  amountCents: number;
  orderId: string;
  payerEmail: string;
  payerName: string;
  payerCpf: string;
  selectedMethod: CheckoutPaymentMethodId;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  sandbox: boolean;
  onPaymentComplete: (result: {
    status: string;
    paymentId: string | number;
  }) => void;
}) {
  switch (selectedMethod) {
    case "pix":
      return (
        <CheckoutPixPanel
          orderId={orderId}
          amountCents={amountCents}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          payerName={payerName}
          onPaymentComplete={onPaymentComplete}
        />
      );
    case "credit_card":
    case "debit_card":
      if (!publicKey) {
        return (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            Pagamentos com cartão não configurados. Configure o Mercado Pago no
            painel admin.
          </p>
        );
      }
      return (
        <CheckoutCardPaymentBrick
          publicKey={publicKey}
          amountCents={amountCents}
          orderId={orderId}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          selectedMethod={selectedMethod}
          maxInstallments={maxInstallments}
          installmentFees={installmentFees}
          sandbox={sandbox}
          onPaymentComplete={onPaymentComplete}
        />
      );
    case "boleto":
      return (
        <CheckoutBoletoPanel
          orderId={orderId}
          amountCents={amountCents}
          payerEmail={payerEmail}
          payerCpf={payerCpf}
          payerName={payerName}
          onPaymentComplete={onPaymentComplete}
        />
      );
  }
}
