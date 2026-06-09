import type { DashboardPeriod } from "@/lib/types/admin-dashboard";

export function getPeriodRange(period: DashboardPeriod): { since: string | null; label: string } {
  const now = new Date();
  if (period === "all") {
    return { since: null, label: "Todo o período" };
  }
  if (period === "mtd") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { since: start.toISOString(), label: "Mês atual" };
  }
  const days = period === "7d" ? 7 : 30;
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { since: start.toISOString(), label: period === "7d" ? "Últimos 7 dias" : "Últimos 30 dias" };
}

export function fillChartDays(
  since: string,
  revenueByDay: Map<string, number>,
): { date: string; revenue: number }[] {
  const start = new Date(since);
  const end = new Date();
  const out: { date: string; revenue: number }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    out.push({ date: key, revenue: (revenueByDay.get(key) ?? 0) / 100 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
