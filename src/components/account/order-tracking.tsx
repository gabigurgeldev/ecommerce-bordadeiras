import { formatOrderStatus } from "@/lib/format";
import type { OrderStatus } from "@/lib/types/database";
import { CheckCircle2, Package, Truck } from "lucide-react";

const flow: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export function OrderTracking({
  status,
  trackingCode,
}: {
  status: OrderStatus;
  trackingCode: string | null;
}) {
  const currentIndex = flow.indexOf(status);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500">Status atual</p>
      <p className="text-lg font-semibold">{formatOrderStatus(status)}</p>
      {trackingCode && (
        <p className="mt-2 text-sm">
          Rastreio:{" "}
          <code className="rounded bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
            {trackingCode}
          </code>
        </p>
      )}
      <ol className="mt-6 space-y-4">
        {flow.map((step, i) => {
          const done = i <= currentIndex;
          const Icon = i < 2 ? CheckCircle2 : i < 4 ? Package : Truck;
          return (
            <li key={step} className="flex items-center gap-3">
              <Icon
                className={
                  done ? "h-5 w-5 text-emerald-500" : "h-5 w-5 text-zinc-300"
                }
              />
              <span
                className={
                  done ? "text-zinc-900 dark:text-white" : "text-zinc-400"
                }
              >
                {formatOrderStatus(step)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
