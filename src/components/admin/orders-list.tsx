"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, ShoppingCart } from "lucide-react";
import { OrderStatusBadge, orderStatusLabels } from "@/components/admin/status-badge";
import { adminFilterSelectClass } from "@/components/admin/admin-list-toolbar";
import { AdminListToolbar } from "@/components/admin/admin-list-toolbar";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { OrderStatus } from "@/lib/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type OrderRow = {
  id: string;
  customerName: string;
  customerEmail: string;
  totalCents: number;
  status: string;
  createdAt: string | Date;
};

function orderShortId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.customerName?.toLowerCase().includes(q) ||
        o.customerEmail?.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

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
      <AdminListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar cliente ou ID…"
        count={filtered.length}
        countLabel="pedidos"
        filters={
          <select
            className={adminFilterSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            {Object.values(OrderStatus).map((s) => (
              <option key={s} value={s}>
                {orderStatusLabels[s] ?? s}
              </option>
            ))}
          </select>
        }
      />

      {filtered.length === 0 ? (
        <AdminEmptyState
          title="Nenhum pedido encontrado"
          description="Tente ajustar a busca ou o filtro de status."
          className="py-10"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-lg border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((order) => (
                  <TableRow key={order.id} className="group">
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
                        <div className="font-medium truncate">{order.customerName || "—"}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {order.customerEmail}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {formatCurrency(order.totalCents)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
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

          {/* Mobile cards */}
          <ul className="md:hidden space-y-3">
            {filtered.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/admin/pedidos/${order.id}`}
                  className={cn(
                    "block rounded-lg border bg-card p-4 shadow-sm transition-colors",
                    "hover:bg-muted/30 active:bg-muted/50",
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
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
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
