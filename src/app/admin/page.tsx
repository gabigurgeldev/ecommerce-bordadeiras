import { getDashboardStats } from "@/actions/admin/dashboard";
import { PageHeader } from "@/components/admin/page-header";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const kpis = [
    { label: "Receita", value: formatCurrency(stats.revenueCents), icon: DollarSign },
    { label: "Pedidos", value: String(stats.orderCount), icon: ShoppingCart },
    { label: "Produtos ativos", value: String(stats.productCount), icon: Package },
    { label: "Clientes", value: String(stats.customerCount), icon: Users },
    {
      label: "Conversão (30d)",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Visão geral da loja" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Receita — últimos 30 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardCharts data={stats.chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
