import { isRedirectError } from "next/dist/client/components/redirect-error";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import type { BlogStats } from "@/lib/blog/types";
import type { BlogPostWithRelations } from "@/lib/types/database";

function BlogLoadError({ message }: { message: string }) {
  return (
    <AdminPageContainer>
      <PageHeader title="Blog" description="Visão geral do conteúdo e engajamento" />
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o dashboard do blog.
        </p>
        <p className="text-xs text-muted-foreground break-words">{message}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="default">
            <Link href="/admin/blog">Tentar novamente</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/blog/posts">Ir para posts</Link>
          </Button>
        </div>
      </div>
    </AdminPageContainer>
  );
}

export default async function AdminBlogDashboardPage() {
  let statsResult: BlogStats;
  let postsResult: { items?: BlogPostWithRelations[] };
  let commentsResult: { items?: Array<Record<string, unknown>> };

  try {
    const [stats, posts, comments] = await Promise.all([
      adminGetBlogStats(),
      adminListBlogPosts({ page: 1, pageSize: 100, sortBy: "updatedAt", sortOrder: "desc" }),
      adminListBlogComments({ page: 1, pageSize: 20, isApproved: "false" }),
    ]);
    statsResult = stats as BlogStats;
    postsResult = posts as { items?: BlogPostWithRelations[] };
    commentsResult = comments as { items?: Array<Record<string, unknown>> };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    const message = e instanceof Error ? e.message : "Erro desconhecido ao carregar o blog";
    console.error("[admin/blog]", e);
    return <BlogLoadError message={message} />;
  }

  if (!statsResult?.posts || !statsResult?.comments) {
    return <BlogLoadError message="Resposta de estatísticas inválida." />;
  }

  const postsRaw = postsResult.items ?? [];
  const posts = postsRaw.map((p) => mapPostRow(p));

  const commentsRaw = commentsResult.items ?? [];
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
  const viewItems = posts
    .filter((p) => p.updatedAt)
    .map((p) => ({ date: p.updatedAt, value: p.views }));
  const chartData = aggregateByDate(chartItems, 30).map((d, i) => ({
    ...d,
    views: aggregateByDate(viewItems, 30)[i]?.views ?? 0,
  }));

  return (
    <AdminPageContainer>
      <PageHeader title="Blog" description="Visão geral do conteúdo e engajamento" />
      <BlogDashboardView
        stats={statsResult}
        posts={posts}
        pendingComments={pendingComments}
        chartData={chartData}
      />
    </AdminPageContainer>
  );
}
