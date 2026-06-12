import { OrderStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const steps = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
] as const;

const stepIndex: Record<string, number> = {
  [OrderStatus.PENDING]: 0,
  [OrderStatus.PAID]: 1,
  [OrderStatus.PROCESSING]: 2,
  [OrderStatus.SHIPPED]: 3,
  [OrderStatus.DELIVERED]: 4,
  [OrderStatus.CANCELLED]: -1,
};

export function OrderStatusPipeline({
  status,
  className,
  size = "sm",
}: {
  status: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const dotClass = size === "md" ? "h-2 w-4" : "h-1.5 w-3";

  if (status === OrderStatus.CANCELLED) {
    return (
      <div className={cn("flex items-center gap-1", className)} title="Cancelado">
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(dotClass, "rounded-full bg-red-200")}
          />
        ))}
      </div>
    );
  }

  const current = stepIndex[status] ?? 0;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      title={status}
      aria-hidden
    >
      {steps.map((step, i) => (
        <span
          key={step}
          className={cn(
            dotClass,
            "rounded-full transition-colors",
            i <= current
              ? "bg-[var(--color-brown)]"
              : "bg-[var(--color-card-border)]",
          )}
        />
      ))}
    </div>
  );
}
