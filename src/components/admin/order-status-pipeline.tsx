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
}: {
  status: string;
  className?: string;
}) {
  if (status === OrderStatus.CANCELLED) {
    return (
      <div className={cn("flex items-center gap-1", className)} title="Cancelado">
        {steps.map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-3 rounded-full bg-red-200 dark:bg-red-900"
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
            "h-1.5 w-3 rounded-full transition-colors",
            i <= current
              ? "bg-primary"
              : "bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );
}
