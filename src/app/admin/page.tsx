import { getDashboardStats } from "@/actions/admin/dashboard";
import { DashboardView } from "@/components/admin/dashboard-view";
import type { DashboardPeriod } from "@/lib/types/admin-dashboard";

function parsePeriod(value: string | undefined): DashboardPeriod {
  if (value === "7d" || value === "30d" || value === "mtd" || value === "all") return value;
  return "30d";
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params.period);
  const stats = await getDashboardStats(period);
  return <DashboardView stats={stats} period={period} />;
}
