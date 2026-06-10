import { formatDate, formatOrderStatus } from "@/lib/format";
import { buildTrackingUrl } from "@/lib/tracking-url";
import type { OrderStatus } from "@/lib/types/database";
import { CheckCircle2, Package, Truck, XCircle } from "lucide-react";

const flow: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

const stepTimestampKey: Record<
  string,
  "paidAt" | "processingAt" | "shippedAt" | "deliveredAt" | null
> = {
  PENDING: null,
  PAID: "paidAt",
  PROCESSING: "processingAt",
  SHIPPED: "shippedAt",
  DELIVERED: "deliveredAt",
};

export function OrderTracking({
  status,
  trackingCode,
  carrier,
  paidAt,
  processingAt,
  shippedAt,
  deliveredAt,
  cancelledAt,
}: {
  status: OrderStatus;
  trackingCode: string | null;
  carrier?: string | null;
  paidAt?: Date | null;
  processingAt?: Date | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  cancelledAt?: Date | null;
}) {
  const timestamps: Record<string, Date | null | undefined> = {
    paidAt,
    processingAt,
    shippedAt,
    deliveredAt,
  };

  const trackingUrl = buildTrackingUrl(carrier, trackingCode);

  if (status === "CANCELLED") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center gap-3">
          <XCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="text-sm text-red-700 dark:text-red-300">Status atual</p>
            <p className="text-lg font-semibold text-red-900 dark:text-red-100">
              Pedido cancelado
            </p>
            {cancelledAt && (
              <p className="mt-1 text-sm text-red-700/80">
                Cancelado em {formatDate(cancelledAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentIndex = flow.indexOf(status);

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-6">
      <p className="text-sm text-[var(--muted-foreground)]">Status atual</p>
      <p className="text-lg font-semibold text-[var(--color-brown)]">
        {formatOrderStatus(status)}
      </p>

      {trackingCode && (
        <div
          className={`mt-4 rounded-xl border p-4 ${
            status === "SHIPPED" || status === "DELIVERED"
              ? "border-emerald-200 bg-emerald-50"
              : "border-[var(--color-card-border)] bg-[var(--secondary)]/30"
          }`}
        >
          <p className="text-sm font-medium text-[var(--color-brown)]">
            Rastreamento
          </p>
          {carrier && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Transportadora: {carrier}
            </p>
          )}
          <p className="mt-2 text-sm">
            Código:{" "}
            <code className="rounded bg-white px-2 py-0.5 font-mono text-sm">
              {trackingCode}
            </code>
          </p>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-cta)] underline-offset-2 hover:underline"
            >
              Rastrear nos Correios
            </a>
          )}
        </div>
      )}

      <ol className="mt-6 space-y-4">
        {flow.map((step, i) => {
          const done = i <= currentIndex;
          const Icon = i < 2 ? CheckCircle2 : i < 4 ? Package : Truck;
          const tsKey = stepTimestampKey[step];
          const ts = tsKey ? timestamps[tsKey] : null;

          return (
            <li key={step} className="flex items-start gap-3">
              <Icon
                className={
                  done
                    ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                    : "mt-0.5 h-5 w-5 shrink-0 text-zinc-300"
                }
              />
              <div>
                <span
                  className={
                    done
                      ? "font-medium text-[var(--color-brown)]"
                      : "text-[var(--muted-foreground)]"
                  }
                >
                  {formatOrderStatus(step)}
                </span>
                {done && ts && (
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatDate(ts)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
