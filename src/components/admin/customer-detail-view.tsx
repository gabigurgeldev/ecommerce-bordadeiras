"use client";

import { CustomerWhatsAppPanel } from "@/components/admin/customer-whatsapp-panel";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatActivityDetail,
  getActivityLabel,
} from "@/lib/activity-labels";
import type { AdminCustomerInsights } from "@/lib/data/admin-customer-insights";
import type { WhatsappTemplate } from "@/lib/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Clock,
  Eye,
  MapPin,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export function CustomerDetailView({
  insights,
  templates,
  whatsappConnected,
}: {
  insights: AdminCustomerInsights & { whatsappConnected: boolean };
  templates: WhatsappTemplate[];
  whatsappConnected: boolean;
}) {
  const { profile, stats, opportunities, interests, activity, reviews, orders } =
    insights;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Receita total"
          value={formatCurrency(stats.lifetimeRevenueCents)}
        />
        <StatCard
          icon={TrendingUp}
          label="Ticket médio"
          value={formatCurrency(stats.avgOrderCents)}
        />
        <StatCard
          icon={Package}
          label="Pedidos"
          value={String(stats.totalOrders)}
          sub={`${stats.paidOrders} pagos · ${stats.pendingOrders} pendentes`}
        />
        <StatCard
          icon={Clock}
          label="Última compra"
          value={
            stats.lastOrderAt
              ? formatDate(stats.lastOrderAt)
              : "Nenhuma"
          }
          sub={
            stats.daysSinceLastOrder != null
              ? `há ${stats.daysSinceLastOrder} dias`
              : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">E-mail:</span> {profile.email}
          </p>
          <p>
            <span className="text-muted-foreground">Telefone:</span>{" "}
            {profile.phone || insights.resolvedPhone || "—"}
          </p>
          <p>
            <span className="text-muted-foreground">Cadastro:</span>{" "}
            {formatDate(profile.createdAt)}
          </p>
          <p>
            <span className="text-muted-foreground">Oportunidade:</span>{" "}
            <OpportunityBadge type={opportunities.primaryOpportunity} />
          </p>
        </CardContent>
      </Card>

      {(opportunities.pendingPaymentOrders.length > 0 ||
        opportunities.activeCart.length > 0) && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-amber-900">Oportunidades de venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {opportunities.pendingPaymentOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-amber-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">Pagamento pendente</p>
                    <p className="text-sm text-muted-foreground">
                      Pedido #{order.id.slice(-8).toUpperCase()} ·{" "}
                      {formatCurrency(order.totalCents)} ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver pedido
                  </Link>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {opportunities.activeCart.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-white p-4">
                <div className="flex items-center gap-2 font-medium">
                  <ShoppingCart className="h-4 w-4" />
                  Sacola ativa · {formatCurrency(opportunities.cartSubtotalCents)}
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {opportunities.activeCart.map((line) => (
                    <li key={line.productId}>
                      {line.name} × {line.quantity} —{" "}
                      {formatCurrency(line.priceCents * line.quantity)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CustomerWhatsAppPanel
        insights={insights}
        templates={templates}
        whatsappConnected={whatsappConnected}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Interesses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {interests.topProducts.length === 0 &&
            interests.recentProductViews.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <>
                {interests.topProducts.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      Produtos (compras + sacola)
                    </p>
                    <ul className="space-y-1 text-sm">
                      {interests.topProducts.map((p, i) => (
                        <li key={`${p.name}-${i}`} className="flex justify-between">
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">
                            {p.totalQuantity}× ·{" "}
                            {p.source === "cart" ? "sacola" : "comprado"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {interests.recentProductViews.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                      Visualizados recentemente
                    </p>
                    <ul className="space-y-1 text-sm">
                      {interests.recentProductViews.map((v) => (
                        <li key={v.productId} className="flex justify-between">
                          <span>{v.productName}</span>
                          <span className="text-muted-foreground">
                            {formatDate(v.viewedAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Atividade no site
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade registrada (cliente precisa estar logado).
              </p>
            ) : (
              <ul className="max-h-80 space-y-3 overflow-y-auto text-sm">
                {activity.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{getActivityLabel(ev.type)}</p>
                      <p className="text-muted-foreground">
                        {formatActivityDetail(
                          ev.type,
                          ev.path,
                          ev.productName,
                          ev.metadata,
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(ev.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {profile.addresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereços
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {profile.addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-lg border p-3 text-sm"
              >
                <p className="font-medium">
                  {addr.recipientName}
                  {addr.isDefault && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Padrão
                    </Badge>
                  )}
                </p>
                <p className="text-muted-foreground">
                  {addr.street}, {addr.number}
                  {addr.complement ? ` — ${addr.complement}` : ""}
                  <br />
                  {addr.neighborhood}, {addr.city} — {addr.state}
                  <br />
                  CEP {addr.zipCode}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">
                  {r.productName} · {r.rating}★
                </p>
                <p className="text-muted-foreground">{r.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <AdminEmptyState
              title="Sem pedidos"
              description="Este cliente ainda não realizou compras."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/admin/pedidos/${order.id}`}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          #{order.id.slice(-8)}
                        </Link>
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalCents)}</TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
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

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
          {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function OpportunityBadge({
  type,
}: {
  type: "pending_payment" | "abandoned_cart" | "none";
}) {
  if (type === "pending_payment") {
    return <Badge variant="destructive">Pagamento pendente</Badge>;
  }
  if (type === "abandoned_cart") {
    return <Badge className="bg-amber-600 hover:bg-amber-600">Sacola ativa</Badge>;
  }
  return <Badge variant="secondary">Nenhuma</Badge>;
}
