"use client";

import { OrdersList } from "@/components/account/orders-list";
import type { OrderSummary } from "@/lib/data/orders";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

type FilterKey = "all" | "active" | "delivered" | "cancelled";

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Em andamento" },
  { key: "delivered", label: "Entregues" },
  { key: "cancelled", label: "Cancelados" },
];

function matchesFilter(order: OrderSummary, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "delivered") return order.status === "DELIVERED";
  if (filter === "cancelled") return order.status === "CANCELLED";
  return !["DELIVERED", "CANCELLED"].includes(order.status);
}

export function OrdersView({ orders }: { orders: OrderSummary[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () => orders.filter((o) => matchesFilter(o, filter)),
    [orders, filter],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                filter === f.key
                  ? "border-[var(--color-brown)] bg-[var(--color-brown)] text-white"
                  : "border-[var(--color-card-border)] text-[var(--color-brown-muted)] hover:border-[var(--color-brown)]/30 hover:text-[var(--color-brown)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          {filtered.length} de {orders.length} pedido
          {orders.length === 1 ? "" : "s"}
        </p>
      </div>
      <OrdersList orders={filtered} />
    </div>
  );
}
