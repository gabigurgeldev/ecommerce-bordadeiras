"use client";

import {
  cardBrickExcludedTypes,
  installmentHint,
  type CheckoutPaymentMethodId,
} from "@/lib/checkout-payment-methods";
import {
  formatMercadoPagoBrickError,
  isCriticalBrickError,
} from "@/lib/mercadopago-brick-errors";
import { MP_SANDBOX_TEST_CPF } from "@/lib/mercadopago-errors";
import { loadMercadoPagoSdk } from "@/lib/mercadopago-sdk";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, Lock, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options?: { locale: string },
    ) => {
      bricks: () => {
        create: (
          brickType: string,
          containerId: string,
          settings: Record<string, unknown>,
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

function PaymentSkeleton() {
  return (
    <div className="absolute inset-0 z-10 animate-pulse space-y-3 rounded-xl bg-white/80 p-1 dark:bg-zinc-900/80">
      <div className="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        <div className="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      </div>
      <div className="h-12 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
      <div className="mt-4 h-12 rounded-xl bg-zinc-300 dark:bg-zinc-600" />
    </div>
  );
}

export function CheckoutCardPaymentBrick({
  publicKey,
  amountCents,
  orderId,
  payerEmail,
  payerCpf,
  selectedMethod,
  maxInstallments,
  installmentFees,
  sandbox,
  onPaymentComplete,
}: {
  publicKey: string;
  amountCents: number;
  orderId: string;
  payerEmail: string;
  payerCpf: string;
  selectedMethod: Extract<CheckoutPaymentMethodId, "credit_card" | "debit_card">;
  maxInstallments: number;
  installmentFees: "merchant" | "buyer";
  sandbox: boolean;
  onPaymentComplete: (result: {
    status: string;
    paymentId: string | number;
  }) => void;
}) {
  const containerId = `mp-card-${orderId}-${selectedMethod}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const brickRef = useRef<{
    unmount: () => void;
    getFormData?: () => Promise<Record<string, unknown>>;
  } | null>(null);
  const onPaymentCompleteRef = useRef(onPaymentComplete);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  onPaymentCompleteRef.current = onPaymentComplete;
  const hint = installmentHint(installmentFees, maxInstallments, selectedMethod);
  const brickCpf = sandbox
    ? MP_SANDBOX_TEST_CPF
    : payerCpf.replace(/\D/g, "");

  const handleSubmit = useCallback(
    (formData: Record<string, unknown>) => {
      setSubmitting(true);
      return fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          formData,
          selectedMethod,
          payerCpf: brickCpf,
          payerEmail: payerEmail.trim().toLowerCase(),
        }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            status?: string;
            paymentId?: string | number;
            error?: string;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Pagamento recusado");
          }
          if (data.status && data.paymentId != null) {
            onPaymentCompleteRef.current({
              status: data.status,
              paymentId: data.paymentId,
            });
          }
        })
        .catch((e: Error) => {
          const message =
            e instanceof Error ? e.message : "Pagamento recusado";
          toast.error(message);
          throw e;
        })
        .finally(() => {
          setSubmitting(false);
        });
    },
    [orderId, selectedMethod, brickCpf, payerEmail],
  );

  function handlePayClick() {
    if (!brickRef.current?.getFormData) {
      toast.error("Formulário do cartão ainda não está pronto.");
      return;
    }
    setSubmitting(true);
    brickRef.current
      .getFormData()
      .then((cardFormData) => handleSubmit(cardFormData))
      .catch((err) => {
        toast.error(formatMercadoPagoBrickError(err));
      })
      .finally(() => setSubmitting(false));
  }

  useEffect(() => {
    if (!publicKey || !orderId || amountCents <= 0 || !brickCpf) return;

    let cancelled = false;
    setReady(false);
    setError(null);

    async function init() {
      try {
        await loadMercadoPagoSdk();
        if (cancelled || !containerRef.current || !window.MercadoPago) return;

        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        if (cancelled || !containerRef.current) return;

        brickRef.current?.unmount();
        brickRef.current = null;

        const mp = new window.MercadoPago(publicKey.trim(), { locale: "pt-BR" });
        const excluded = cardBrickExcludedTypes(selectedMethod);

        const controller = await mp.bricks().create("cardPayment", containerId, {
          initialization: {
            amount: amountCents / 100,
            payer: {
              email: payerEmail.trim().toLowerCase(),
              identification: { type: "CPF", number: brickCpf },
            },
          },
          customization: {
            paymentMethods: {
              maxInstallments:
                selectedMethod === "credit_card" ? maxInstallments : 1,
              types: { excluded },
            },
            visual: {
              hideFormTitle: true,
              hidePaymentButton: true,
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setReady(true);
            },
            onError: (err: unknown) => {
              console.error("[CardPaymentBrick]", err);
              if (cancelled || !isCriticalBrickError(err)) return;
              setError(formatMercadoPagoBrickError(err));
            },
          },
        });

        brickRef.current = controller;
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "Não foi possível carregar o formulário do cartão",
          );
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      brickRef.current?.unmount();
      brickRef.current = null;
    };
  }, [
    publicKey,
    amountCents,
    orderId,
    payerEmail,
    brickCpf,
    selectedMethod,
    maxInstallments,
    containerId,
    retryKey,
  ]);

  return (
    <div>
      {hint && (
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      )}

      {sandbox && (
        <p className="mb-3 text-xs text-amber-700 dark:text-amber-400">
          Sandbox: CPF <strong>12345678909</strong>, cartão{" "}
          <strong>5031 4332 1540 6351</strong> (Mastercard), validade{" "}
          <strong>11/30</strong>, CVV <strong>123</strong>. Nome do titular:{" "}
          <strong>APRO</strong> (aprovado) ou <strong>OTHE</strong> (recusado).
        </p>
      )}

      {error && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-800 dark:bg-red-950/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRetryKey((k) => k + 1);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </button>
        </div>
      )}

      <div className="checkout-card-brick relative w-full overflow-visible">
        {!ready && !error && <PaymentSkeleton />}
        <div
          id={containerId}
          ref={containerRef}
          className={cn(
            "w-full transition-opacity duration-300",
            !ready && !error ? "min-h-[240px] opacity-0" : "opacity-100",
          )}
        />
      </div>

      {ready && !error && (
        <Button
          type="button"
          className="mt-4 w-full"
          size="lg"
          disabled={submitting}
          onClick={handlePayClick}
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          Pagar com cartão
        </Button>
      )}
    </div>
  );
}
