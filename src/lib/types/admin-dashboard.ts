export type DashboardPeriod = "7d" | "30d" | "mtd" | "all";

export type DashboardChartPoint = { date: string; revenue: number };

export type DashboardRecentOrder = {
  id: string;
  totalCents: number;
  status: string;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
};

export type DashboardOrderStatusCount = { status: string; count: number };

export type DashboardTopProduct = {
  productId: string;
  name: string;
  quantity: number;
  revenueCents: number;
};

export type DashboardAuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userEmail: string | null;
  createdAt: string;
};

export type DashboardStats = {
  period: DashboardPeriod;
  periodLabel: string;
  revenueCents: number;
  revenuePeriodCents: number;
  revenueTodayCents: number;
  revenueMtdCents: number;
  orderCount: number;
  orderCountPeriod: number;
  ordersToday: number;
  pendingOrders: number;
  productCount: number;
  inactiveProductCount: number;
  lowStockCount: number;
  customerCount: number;
  newCustomersPeriod: number;
  activeCoupons: number;
  conversionRate: number;
  aovCents: number;
  chartData: DashboardChartPoint[];
  recentOrders: DashboardRecentOrder[];
  ordersByStatus: DashboardOrderStatusCount[];
  topProducts: DashboardTopProduct[];
  recentAudit: DashboardAuditRow[];
};
