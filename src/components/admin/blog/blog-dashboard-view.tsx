"use client";

import Link from "next/link";
import {
  BarChart3,
  Eye,
  FileText,
  MessageSquare,
  Pencil,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminStatsCard } from "@/components/admin/admin-stats-card";
import type { BlogCommentRow } from "@/components/admin/blog/blog-comments-list";
import type { BlogPostRow } from "@/components/admin/blog/blog-utils";
import { BlogStatusBadge } from "@/components/admin/blog/blog-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BlogStats } from "@/lib/blog/types";
import { formatDate } from "@/lib/utils";

const PIE_COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#6366f1", "#ec4899"];

function formatChartDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function BlogDashboardView({
  stats,
  posts,
  pendingComments,
  chartData,
}: {
  stats: BlogStats;
  posts: BlogPostRow[];
  pendingComments: BlogCommentRow[];
  chartData: Array<{ date: string; count: number; views: number }>;
}) {
  const topPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 5);
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const pieData = stats.categories
    .filter((c) => c.postsCount > 0)
    .slice(0, 5)
    .map((c) => ({ name: c.name, value: c.postsCount }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatsCard
          label="Total de posts"
          value={String(stats.posts.total)}
          icon={FileText}
          href="/admin/blog/posts"
          highlight
        />
        <AdminStatsCard
          label="Publicados"
          value={String(stats.posts.published)}
          icon={BarChart3}
          href="/admin/blog/posts"
        />
        <AdminStatsCard
          label="Rascunhos"
          value={String(stats.posts.draft)}
          icon={Pencil}
          href="/admin/blog/posts"
        />
        <AdminStatsCard
          label="Visualizações"
          value={stats.posts.totalViews.toLocaleString("pt-BR")}
          icon={Eye}
        />
        <AdminStatsCard
          label="Comentários pendentes"
          value={String(stats.comments.pending)}
          icon={MessageSquare}
          href="/admin/blog/comentarios"
          highlight={stats.comments.pending > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Posts publicados</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.every((d) => d.count === 0) ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sem publicações no período.
              </div>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDate}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <Tooltip
                      labelFormatter={(l) => formatChartDate(String(l))}
                      formatter={(v: number) => [v, "Posts"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      fill="var(--primary)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Visualizações acumuladas</CardTitle>
            <CardDescription>Distribuição por dia (posts atualizados)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatChartDate}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    labelFormatter={(l) => formatChartDate(String(l))}
                    formatter={(v: number) => [v.toLocaleString("pt-BR"), "Views"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>Top 5 posts</CardTitle>
            <CardDescription>Mais visualizados</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum post ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  topPosts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/admin/blog/posts/${p.id}`} className="hover:underline">
                          {p.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{p.views.toLocaleString("pt-BR")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Posts por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Sem dados.
              </div>
            ) : (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {pieData.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {d.name}: {d.value}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Comentários para moderar</CardTitle>
              <CardDescription>Pendentes de aprovação</CardDescription>
            </div>
            <Link href="/admin/blog/comentarios" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingComments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum comentário pendente.</p>
            ) : (
              pendingComments.slice(0, 5).map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{c.authorName}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{c.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">em {c.postTitle}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Atividade recente</CardTitle>
            <CardDescription>Posts atualizados recentemente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atividade.</p>
            ) : (
              recentPosts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border p-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/blog/posts/${p.id}`} className="line-clamp-1 text-sm font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDate(p.updatedAt)}</p>
                  </div>
                  <BlogStatusBadge status={p.status} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
