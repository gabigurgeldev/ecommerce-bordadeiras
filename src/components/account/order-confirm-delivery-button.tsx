"use client";

import { confirmOrderDelivered } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { PackageCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function OrderConfirmDeliveryButton({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status !== "SHIPPED") return null;

  async function onConfirm() {
    setLoading(true);
    const result = await confirmOrderDelivered(orderId);
    setLoading(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Entrega confirmada! Obrigado pela compra.");
    router.refresh();
  }

  return (
    <div className="account-card border-emerald-200 bg-emerald-50/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <PackageCheck className="h-5 w-5 text-emerald-700" />
          </span>
          <div>
            <p className="font-medium text-[var(--color-brown)]">
              Seu pedido chegou?
            </p>
            <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">
              Confirme o recebimento para concluir o acompanhamento deste
              pedido.
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => void onConfirm()}
          disabled={loading}
          className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? "Confirmando…" : "Confirmar que chegou"}
        </Button>
      </div>
    </div>
  );
}
