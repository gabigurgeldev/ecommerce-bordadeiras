"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { AlertCircle, Check, Copy, Loader2, QrCode, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type PixData = {
  paymentId: string | number;
  qrCodeBase64: string;
  qrCode: string;
  status: string;
};

export function CheckoutPixPanel({
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
  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const onCompleteRef = useRef(onPaymentComplete);
  onCompleteRef.current = onPaymentComplete;

  const createPix = useCallback(
    async (forceNew = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/payments/pix", {
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
        const data = (await res.json()) as PixData & { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Falha ao gerar PIX");
        }
        setPix(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Falha ao gerar PIX");
      } finally {
        setLoading(false);
      }
    },
    [orderId, payerEmail, payerCpf, payerName],
  );

  useEffect(() => {
    if (!pix?.paymentId) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/${pix.paymentId}/status`);
        if (!res.ok) return;
        const data = (await res.json()) as { status: string };
        if (data.status === "approved") {
          onCompleteRef.current({ status: "approved", paymentId: pix.paymentId });
        } else if (data.status === "rejected" || data.status === "cancelled") {
          onCompleteRef.current({ status: data.status, paymentId: pix.paymentId });
        }
      } catch {
        /* ignore poll errors */
      }
    }, 5000);

    return () => clearInterval(id);
  }, [pix?.paymentId]);

  async function handleCopy() {
    if (!pix?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pix.qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  if (!pix && !loading && !error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pague {formatCurrency(amountCents)} via PIX
        </p>
        <Button
          type="button"
          className="w-full sm:w-auto"
          size="lg"
          onClick={() => void createPix(false)}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Gerar PIX
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-zinc-600">Gerando PIX…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-950/30">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <Button type="button" variant="outline" onClick={() => void createPix(true)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (!pix) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-950/20">
        <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
          Pague {formatCurrency(amountCents)} via PIX
        </p>
        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
          Escaneie o QR Code ou copie o código abaixo
        </p>
      </div>

      <div className="flex justify-center">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <Image
            src={`data:image/png;base64,${pix.qrCodeBase64}`}
            alt="QR Code PIX"
            width={220}
            height={220}
            unoptimized
            className="h-[220px] w-[220px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500">PIX copia e cola</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={pix.qrCode}
            className="min-w-0 flex-1 rounded-lg border bg-zinc-50 px-3 py-2 font-mono text-xs dark:bg-zinc-800"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy()}>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-zinc-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Aguardando confirmação do pagamento…
      </p>
    </div>
  );
}
