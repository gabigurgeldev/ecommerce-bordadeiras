"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

type ChartPoint = { date: string; revenue: number };

function formatChartDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function DashboardCharts({ data }: { data: ChartPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        Sem dados no período selecionado.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full min-h-[240px]">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={formatChartDate}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v: number) =>
            v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
          }
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
          labelFormatter={(label) => formatChartDate(String(label))}
          formatter={(value: number) => [formatCurrency(Math.round(value * 100)), "Receita"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#adminRevenue)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}
