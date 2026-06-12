import { formatOrderStatus } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-900 ring-amber-200",
  PAID: "bg-sky-50 text-sky-900 ring-sky-200",
  PROCESSING: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  SHIPPED: "bg-violet-50 text-violet-900 ring-violet-200",
  DELIVERED: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function OrderStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        statusStyles[status] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200",
        className,
      )}
    >
      {formatOrderStatus(status)}
    </span>
  );
}
