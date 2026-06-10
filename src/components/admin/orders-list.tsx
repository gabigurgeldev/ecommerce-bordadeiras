"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Package, ShoppingCart } from "lucide-react";
import {
  DEFAULT_ORDER_FILTERS,
  OrderAdvancedFilters,
  type OrderAdvancedFilterState,
} from "@/components/admin/order-advanced-filters";
import {
  OrderStatusFilterChips,
  type StatusChipFilter,
} from "@/components/admin/order-status-filter-chips";
import { OrderStatusPipeline } from "@/components/admin/order-status-pipeline";
import {
  OrderStatusBadge,
  orderStatusBorderClass,
} from "@/components/admin/status-badge";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { OrderStatus } from "@/lib/types/database";
import {
  formatAdminPaymentMethod,
  type AdminOrderListRow,
} from "@/lib/types/admin-orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

function orderShortId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

function toDate(value: string | Date | null): Date | null {
  if (!value) return null;
  return typeof value === "string" ? new Date(value) : value;
}

function getRelevantDate(order: AdminOrderListRow): Date {
  if (order.status === OrderStatus.PENDING) {
    return toDate(order.createdAt) ?? new Date(0);
  }
  return toDate(order.paidAt) ?? toDate(order.createdAt) ?? new Date(0);
}

function getPeriodBounds(filters: OrderAdvancedFilterState): {
  from: Date | null;
  to: Date | null;
} {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (filters.periodPreset) {
    case "today":
      return { from: startOfToday, to: now };
    case "7d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from, to: now };
    }
    case "30d": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from, to: now };
    }
    case "custom": {
      const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
      const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;
      return { from, to };
    }
    default:
      return { from: null, to: null };
  }
}

function parseReaisToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  if (Number.isNaN(n)) return null;
  return Math.round(n * 100);
}

function formatRelevantDateLabel(order: AdminOrderListRow): string {
  const date = getRelevantDate(order);
  const formatted = formatDate(date);
  if (order.status === OrderStatus.PENDING) return `Criado ${formatted}`;
  return `Pago ${formatted}`;
}

function applyFilters(
  orders: AdminOrderListRow[],
  search: string,
  statusFilter: StatusChipFilter,
  filters: OrderAdvancedFilterState,
): AdminOrderListRow[] {
  const q = search.trim().toLowerCase();
  const { from, to } = getPeriodBounds(filters);
  const minCents = parseReaisToCents(filters.minValue);
  const maxCents = parseReaisToCents(filters.maxValue);

  let result = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;

    if (filters.quickPreset === "awaiting_ship") {
      if (o.status !== OrderStatus.PAID && o.status !== OrderStatus.PROCESSING) {
        return false;
      }
    } else if (filters.quickPreset === "in_transit") {
      if (o.status !== OrderStatus.SHIPPED) return false;
    }

    if (filters.paymentMethod !== "all" && o.paymentMethod !== filters.paymentMethod) {
      return false;
    }

    if (filters.tracking === "with" && !o.trackingCode?.trim()) return false;
    if (filters.tracking === "without" && o.trackingCode?.trim()) return false;

    if (minCents != null && o.totalCents < minCents) return false;
    if (maxCents != null && o.totalCents > maxCents) return false;

    const relevant = getRelevantDate(o);
    if (from && relevant < from) return false;
    if (to && relevant > to) return false;

    if (!q) return true;
    return (
      o.customerName?.toLowerCase().includes(q) ||
      o.customerEmail?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.trackingCode?.toLowerCase().includes(q)
    );
  });

  result = [...result].sort((a, b) => {
    switch (filters.sort) {
      case "oldest":
        return getRelevantDate(a).getTime() - getRelevantDate(b).getTime();
      case "value_desc":
        return b.totalCents - a.totalCents;
      case "value_asc":
        return a.totalCents - b.totalCents;
      default:
        return getRelevantDate(b).getTime() - getRelevantDate(a).getTime();
    }
  });

  return result;
}

export function OrdersList({ orders }: { orders: AdminOrderListRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusChipFilter>("all");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<OrderAdvancedFilterState>(DEFAULT_ORDER_FILTERS);

  const filtered = useMemo(
    () => applyFilters(orders, search, statusFilter, advancedFilters),
    [orders, search, statusFilter, advancedFilters],
  );

  if (orders.length === 0) {
    return (
      <AdminEmptyState
        icon={ShoppingCart}
        title="Nenhum pedido ainda"
        description="Quando houver vendas, elas aparecerão aqui."
      />
    );
  }

  return (
    <>
      <OrderStatusFilterChips
        orders={orders}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cliente, ID ou rastreio…"
        count={filtered.length}
        countLabel="pedidos"
      />

      <OrderAdvancedFilters
        filters={advancedFilters}
        onChange={setAdvancedFilters}
        onReset={() => setAdvancedFilters(DEFAULT_ORDER_FILTERS)}
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="Nenhum pedido encontrado"
          description="Tente ajustar a busca ou os filtros."
          className="py-10"
        />
      ) : (
        <>
          <div className="hidden md:block overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Andamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow
                    key={order.id}
                    className={cn(
                      "group border-l-4",
                      orderStatusBorderClass[order.status] ?? "border-l-transparent",
                    )}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="hover:text-foreground hover:underline"
                      >
                        {orderShortId(order.id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/pedidos/${order.id}`} className="block min-w-0">
                        <div className="font-medium truncate">
                          {order.customerName || "—"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.customerEmail}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <OrderStatusPipeline status={order.status} />
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {order.itemCount}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatAdminPaymentMethod(order.paymentMethod)}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">
                      {order.trackingCode || "—"}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelevantDateLabel(order)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="inline-flex text-muted-foreground transition-colors group-hover:text-foreground"
                        aria-label={`Ver pedido ${orderShortId(order.id)}`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="md:hidden space-y-3">
            {filtered.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className={cn(
                    "block rounded-lg border border-l-4 bg-card p-4 shadow-sm transition-colors",
                    "hover:bg-muted/30 active:bg-muted/50",
                    orderStatusBorderClass[order.status] ?? "border-l-transparent",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {order.customerName || "Cliente sem nome"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customerEmail}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {orderShortId(order.id)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} className="shrink-0" />
                  </div>

                  <div className="mt-3">
                    <OrderStatusPipeline status={order.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      {order.itemCount} {order.itemCount === 1 ? "item" : "itens"}
                    </span>
                    <span>{formatAdminPaymentMethod(order.paymentMethod)}</span>
                    {order.trackingCode && (
                      <span className="font-mono truncate">{order.trackingCode}</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatRelevantDateLabel(order)}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(order.totalCents)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
