"use client";

import {
  buildAvailableMethods,
  type CheckoutPaymentMethodId,
} from "@/lib/checkout-payment-methods";
import type { MercadoPagoEnabledMethods } from "@/lib/mercadopago-config";
import { PaymentMethodIcon } from "@/components/checkout/payment-method-icon";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function CheckoutPaymentMethodSelector({
  enabledMethods,
  maxInstallments,
  installmentFees,
  selectedMethod,
  onSelect,
}: {
  enabledMethods: MercadoPagoEnabledMethods;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  selectedMethod: CheckoutPaymentMethodId | null;
  onSelect: (method: CheckoutPaymentMethodId) => void;
}) {
  const options = buildAvailableMethods(
    enabledMethods,
    maxInstallments,
    installmentFees,
  );

  if (options.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
        Nenhuma forma de pagamento disponível. Configure os métodos no painel
        admin.
      </p>
    );
  }

  return (
    <div
      className="grid gap-3 sm:grid-cols-1 lg:grid-cols-1"
      role="radiogroup"
      aria-label="Forma de pagamento"
    >
      {options.map((option) => {
        const isSelected = selectedMethod === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(option.id)}
            className={cn(
              "group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all touch-manipulation",
              isSelected
                ? "border-rose-500 bg-rose-50/90 shadow-sm ring-1 ring-rose-200 dark:border-rose-400 dark:bg-rose-950/40 dark:ring-rose-900"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600",
            )}
          >
            <span
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border bg-white p-2 shadow-sm transition-colors",
                isSelected
                  ? "border-rose-200 dark:border-rose-800"
                  : "border-zinc-100 dark:border-zinc-700",
              )}
            >
              <PaymentMethodIcon method={option.id} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {option.label}
              </span>
              <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                {option.description}
              </span>
            </span>

            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isSelected
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-zinc-300 bg-transparent text-transparent group-hover:border-zinc-400 dark:border-zinc-600",
              )}
              aria-hidden
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
