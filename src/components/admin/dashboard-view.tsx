"use client";

import Link from "next/link";
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Ticket,
  AlertTriangle,
} from "lucide-react";
import type { DashboardPeriod, DashboardStats } from "@/lib/types/admin-dashboard";
import { AdminStatsCard } from "@/components/admin/admin-stats-card";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";

const auditActionLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Atualização",
  DELETE: "Exclusão",
  SETTINGS_CHANGE: "Configuração",
};

const periods: { value: DashboardPeriod; label: string }[] = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "mtd", label: "Mês" },
  { value: "all", label: "Total" },
];

export function DashboardView({
  stats,
  period,
}: {
  stats: DashboardStats;
  period: DashboardPeriod;
}) {
  const current = period;

  const primaryKpis = [
    {
      label: "Receita no período",
      value: formatCurrency(stats.revenuePeriodCents),
      subtitle: stats.periodLabel,
      icon: DollarSign,
      href: "/admin/pedidos",
    },
    {
      label: "Pedidos no período",
      value: String(stats.orderCountPeriod),
      subtitle: stats.periodLabel,
      icon: ShoppingCart,
      href: "/admin/pedidos",
    },
    {
      label: "Ticket médio",
      value: formatCurrency(stats.aovCents),
      subtitle: "Pedidos pagos no período",
      icon: TrendingUp,
    },
    {
      label: "Conversão",
      value: `${stats.conversionRate.toFixed(1)}%`,
      subtitle: "Pagos / não cancelados",
      icon: TrendingUp,
    },
  ];

  const secondaryKpis = [
    { label: "Receita hoje", value: formatCurrency(stats.revenueTodayCents), icon: DollarSign },
    { label: "Receita no mês", value: formatCurrency(stats.revenueMtdCents), icon: DollarSign },
    { label: "Receita total", value: formatCurrency(stats.revenueCents), icon: DollarSign },
    { label: "Pedidos (total)", value: String(stats.orderCount), icon: ShoppingCart, href: "/admin/pedidos" },
    { label: "Pendentes", value: String(stats.pendingOrders), icon: ShoppingCart, href: "/admin/pedidos" },
    { label: "Pedidos hoje", value: String(stats.ordersToday), icon: ShoppingCart, href: "/admin/pedidos" },
    { label: "Produtos ativos", value: String(stats.productCount), icon: Package, href: "/admin/produtos" },
    { label: "Estoque baixo", value: String(stats.lowStockCount), icon: AlertTriangle, href: "/admin/produtos" },
    { label: "Clientes", value: String(stats.customerCount), icon: Users, href: "/admin/clientes" },
    { label: "Novos clientes", value: String(stats.newCustomersPeriod), icon: Users, href: "/admin/clientes" },
    { label: "Cupons ativos", value: String(stats.activeCoupons), icon: Ticket, href: "/admin/cupons" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Receita calculada apenas com pagamentos aprovados"
        actions={
          <div className="inline-flex w-full flex-wrap gap-0.5 rounded-lg border bg-muted/30 p-1 sm:w-auto">
            {periods.map((p) => {
              const href = p.value === "30d" ? "/admin" : `/admin?period=${p.value}`;
              return (
                <Button
                  key={p.value}
                  size="sm"
                  variant={current === p.value ? "default" : "ghost"}
                  className={cn(
                    "min-w-0 flex-1 sm:min-w-[4.5rem] sm:flex-none",
                    current !== p.value && "text-muted-foreground",
                  )}
                  asChild
                >
                  <Link href={href} aria-current={current === p.value ? "page" : undefined}>
                    {p.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primaryKpis.map((kpi) => (
          <AdminStatsCard key={kpi.label} {...kpi} highlight />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Receita</CardTitle>
            <CardDescription>{stats.periodLabel} — valores em reais</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <DashboardCharts data={stats.chartData} />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Pedidos por status</CardTitle>
            <CardDescription>Distribuição atual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stats.ordersByStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pedidos.</p>
            ) : (
              stats.ordersByStatus.map((row) => (
                <div
                  key={row.status}
                  className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 hover:border-border hover:bg-muted/30"
                >
                  <OrderStatusBadge status={row.status} />
                  <span className="text-sm font-semibold tabular-nums">{row.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold">Indicadores adicionais</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {secondaryKpis.map((kpi) => (
            <AdminStatsCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pedidos recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
            ) : (
              <div className="-mx-2 overflow-x-auto">
                <Table className="min-w-[320px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.map((o) => (
                      <TableRow key={o.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Link href={`/admin/pedidos/${o.id}`} className="block">
                            <span className="font-medium">
                              {o.customerName ?? o.customerEmail ?? "—"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums">{formatCurrency(o.totalCents)}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Top produtos</CardTitle>
            <CardDescription>{stats.periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem vendas no período.</p>
            ) : (
              <ul className="space-y-3">
                {stats.topProducts.map((p, i) => (
                  <li
                    key={p.productId}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="mr-2 text-xs font-medium text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="font-medium">{p.name}</span>
                      <p className="text-xs text-muted-foreground">{p.quantity} un.</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">
                      {formatCurrency(p.revenueCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Atividade recente</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/auditoria">Auditoria completa</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats.recentAudit.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro.</p>
          ) : (
              <div className="-mx-2 overflow-x-auto">
                <Table className="min-w-[480px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead className="hidden md:table-cell">Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentAudit.map((a) => (
                      <TableRow key={a.id} className="hover:bg-muted/40">
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(a.createdAt).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {auditActionLabels[a.action] ?? a.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="font-medium">{a.entity}</div>
                          {a.entityId ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {a.entityId.slice(0, 8)}…
                            </span>
                          ) : null}
                          {a.userEmail && (
                            <p className="mt-0.5 text-xs text-muted-foreground md:hidden">
                              {a.userEmail}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {a.userEmail ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
