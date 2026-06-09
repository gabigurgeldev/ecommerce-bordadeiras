"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";

type BoletoData = {
  paymentId: string | number;
  status: string;
  ticketUrl?: string;
};

export function CheckoutBoletoPanel({
  orderId,
  amountCents,
  payerEmail,
  payerCpf,
  payerName,
  onPaymentComplete,
}: {
  orderId: string;
  amountCents: number;
  payerEmail: string;
  payerCpf: string;
  payerName: string;
  onPaymentComplete: (result: {
    status: string;
    paymentId: string | number;
  }) => void;
}) {
  const [boleto, setBoleto] = useState<BoletoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const createBoleto = useCallback(
    async (forceNew = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/payments/boleto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            payerEmail,
            payerCpf,
            payerName,
            reuse: !forceNew,
          }),
        });
        const data = (await res.json()) as BoletoData & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Falha ao gerar boleto");
        }
        setBoleto(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao gerar boleto");
      } finally {
        setLoading(false);
      }
    },
    [orderId, payerEmail, payerCpf, payerName],
  );

  async function handleCheckStatus() {
    if (!boleto?.paymentId) return;
    setChecking(true);
    try {
      const res = await fetch(`/api/payments/${boleto.paymentId}/status`);
      if (!res.ok) return;
      const data = (await res.json()) as { status: string };
      if (data.status === "approved") {
        onPaymentComplete({ status: "approved", paymentId: boleto.paymentId });
      } else if (data.status === "rejected" || data.status === "cancelled") {
        onPaymentComplete({ status: data.status, paymentId: boleto.paymentId });
      }
    } finally {
      setChecking(false);
    }
  }

  function handleContinue() {
    if (!boleto) return;
    onPaymentComplete({ status: "pending", paymentId: boleto.paymentId });
  }

  if (!boleto && !loading && !error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Boleto de {formatCurrency(amountCents)}
        </p>
        <Button
          type="button"
          className="w-full sm:w-auto"
          size="lg"
          onClick={() => void createBoleto(false)}
        >
          <FileText className="mr-2 h-4 w-4" />
          Gerar boleto
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-sm text-zinc-600">Gerando boleto…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-700">{error}</p>
        <Button type="button" variant="outline" onClick={() => void createBoleto(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!boleto) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Boleto gerado — {formatCurrency(amountCents)}
        </p>
        <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
          O boleto vence em até 3 dias úteis. Após o pagamento, a confirmação pode
          levar até 2 dias úteis.
        </p>
      </div>

      {boleto.ticketUrl && (
        <a
          href={boleto.ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir e imprimir boleto
        </a>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={checking}
        onClick={() => void handleCheckStatus()}
      >
        {checking ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        Verificar pagamento
      </Button>

      <Button type="button" className="w-full" size="lg" onClick={handleContinue}>
        Continuar
      </Button>
    </div>
  );
}
