import {
  adminGetBlogStats,
  adminListBlogComments,
  adminListBlogPosts,
} from "@/actions/admin/blog-ext";
import { BlogDashboardView } from "@/components/admin/blog/blog-dashboard-view";
import type { BlogCommentRow } from "@/components/admin/blog/blog-comments-list";
import { aggregateByDate, mapPostRow } from "@/components/admin/blog/blog-utils";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import type { BlogStats } from "@/lib/blog/types";
import type { BlogPostWithRelations } from "@/lib/types/database";

export default async function AdminBlogDashboardPage() {
  const [statsResult, postsResult, commentsResult] = await Promise.all([
    adminGetBlogStats(),
    adminListBlogPosts({ page: 1, pageSize: 100, sortBy: "updatedAt", sortOrder: "desc" }),
    adminListBlogComments({ page: 1, pageSize: 20, isApproved: "false" }),
  ]);

  const stats = statsResult as BlogStats;
  const postsRaw = (postsResult as { items?: BlogPostWithRelations[] }).items ?? [];
  const posts = postsRaw.map((p) => mapPostRow(p));

  const commentsRaw = (commentsResult as { items?: Array<Record<string, unknown>> }).items ?? [];
  const postMap = new Map(posts.map((p) => [p.id, p]));

  const pendingComments: BlogCommentRow[] = commentsRaw.map((c) => {
    const postId = String(c.postId);
    const post = postMap.get(postId);
    return {
      id: String(c.id),
      postId,
      postTitle: post?.title ?? "Post",
      postSlug: post?.slug ?? "",
      authorName: String(c.authorName),
      authorEmail: String(c.authorEmail),
      content: String(c.content),
      isApproved: Boolean(c.isApproved),
      createdAt: String(c.createdAt),
    };
  });

  const chartItems = posts
    .filter((p) => p.publishedAt)
    .map((p) => ({ date: p.publishedAt!, value: p.views }));
  const viewItems = posts.map((p) => ({ date: p.updatedAt, value: p.views }));
  const chartData = aggregateByDate(chartItems, 30).map((d, i) => ({
    ...d,
    views: aggregateByDate(viewItems, 30)[i]?.views ?? 0,
  }));

  return (
    <AdminPageContainer>
      <PageHeader title="Blog" description="Visão geral do conteúdo e engajamento" />
      <BlogDashboardView
        stats={stats}
        posts={posts}
        pendingComments={pendingComments}
        chartData={chartData}
      />
    </AdminPageContainer>
  );
}
