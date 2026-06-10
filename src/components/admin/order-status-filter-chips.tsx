"use client";

import { orderStatusLabels } from "@/components/admin/status-badge";
import { OrderStatus } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export type StatusChipFilter = "all" | (typeof OrderStatus)[keyof typeof OrderStatus];

const chipOrder: StatusChipFilter[] = [
  "all",
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

const chipLabels: Record<string, string> = {
  all: "Todos",
  ...orderStatusLabels,
};

export function OrderStatusFilterChips({
  orders,
  active,
  onChange,
}: {
  orders: { status: string }[];
  active: StatusChipFilter;
  onChange: (filter: StatusChipFilter) => void;
}) {
  const counts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chipOrder.map((chip) => {
        const count =
          chip === "all" ? orders.length : (counts[chip] ?? 0);
        const isActive = active === chip;

        return (
          <button
            key={chip}
            type="button"
            onClick={() => onChange(chip)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <span>{chipLabels[chip] ?? chip}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                isActive ? "bg-primary-foreground/20" : "bg-muted",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
