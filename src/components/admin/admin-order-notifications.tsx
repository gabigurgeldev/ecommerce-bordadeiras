"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  fetchAdminOrderNotifications,
  type AdminOrderNotificationItem,
} from "@/actions/admin/order-notifications";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getLastSeenAt,
  markOrdersSeenNow,
} from "@/lib/admin-order-notifications-storage";
import { formatDate } from "@/lib/format";
import { cn, formatCurrency } from "@/lib/utils";

const POLL_MS = 30_000;

function orderShortId(id: string) {
  return `#${id.slice(-8).toUpperCase()}`;
}

function isUnread(paidAt: string, lastSeenAt: string) {
  return new Date(paidAt).getTime() > new Date(lastSeenAt).getTime();
}

export function AdminOrderNotifications() {
  const [lastSeenAt, setLastSeenAt] = useState(getLastSeenAt);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<AdminOrderNotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const since = getLastSeenAt();
      const result = await fetchAdminOrderNotifications(since);
      setLastSeenAt(since);
      setUnreadCount(result.unreadCount);
      setRecent(result.recent);
    } catch {
      /* ignore poll errors */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const handleMarkAllRead = () => {
    const now = markOrdersSeenNow();
    setLastSeenAt(now);
    setUnreadCount(0);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setLoading(true);
      void refresh().finally(() => setLoading(false));
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} pedido${unreadCount !== 1 ? "s" : ""} novo${unreadCount !== 1 ? "s" : ""}`
              : "Notificações de pedidos"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <DropdownMenuLabel className="p-0 text-sm font-semibold">
            Pedidos pagos
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />

        <div className="max-h-80 overflow-y-auto">
          {loading && recent.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : recent.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nenhum pedido pago ainda.
            </p>
          ) : (
            <ul className="divide-y">
              {recent.map((order) => {
                const unread = isUnread(order.paidAt, lastSeenAt);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className={cn(
                        "block px-3 py-2.5 transition-colors hover:bg-muted/60",
                        unread && "bg-primary/5",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {order.customerName || "Cliente"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {orderShortId(order.id)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(order.totalCents)}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <OrderStatusBadge status={order.status} className="text-[10px]" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(order.paidAt)}
                        </span>
                      </div>
                      {unread && (
                        <span className="mt-1 inline-block text-[10px] font-medium text-primary">
                          Novo
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/admin/pedidos" onClick={() => setOpen(false)}>
              Ver todos os pedidos
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
