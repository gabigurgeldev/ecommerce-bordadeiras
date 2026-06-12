"use client";

import { fetchUserOrder } from "@/actions/orders";
import { isPaidOrderStatus } from "@/lib/order-status";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const POLL_MS = 8000;

export function OrderPendingPoller({ orderId }: { orderId: string }) {
  const router = useRouter();
  const refreshed = useRef(false);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    async function check() {
      const order = await fetchUserOrder(orderId);
      if (!order || refreshed.current) return false;

      if (isPaidOrderStatus(order.status)) {
        refreshed.current = true;
        setPolling(false);
        toast.success("Pagamento confirmado!");
        router.refresh();
        return true;
      }
      return false;
    }

    void check();

    const interval = setInterval(() => {
      if (refreshed.current) {
        clearInterval(interval);
        return;
      }
      void check().then((done) => {
        if (done) clearInterval(interval);
      });
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [orderId, router]);

  if (!polling) return null;

  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      Atualizando status automaticamente enquanto aguardamos a confirmação do
      pagamento…
    </p>
  );
}
