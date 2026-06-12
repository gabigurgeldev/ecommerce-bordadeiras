import { getDb, TABLES } from "@/lib/supabase/db";
import type { BlogStats } from "@/lib/blog/types";
import { BlogPostStatus } from "@/lib/types/database";
import { countPendingComments } from "@/lib/blog/blog-comment-service";
import { listBlogCategories } from "@/lib/blog/blog-category-service";

export async function getBlogStats(): Promise<BlogStats> {
  const db = getDb();

  const statuses = [
    BlogPostStatus.PUBLISHED,
    BlogPostStatus.DRAFT,
    BlogPostStatus.ARCHIVED,
    BlogPostStatus.SCHEDULED,
  ] as const;

  const counts = await Promise.all(
    statuses.map(async (status) => {
      const { count } = await db
        .from(TABLES.BlogPost)
        .select("id", { count: "exact", head: true })
        .eq("status", status)
        .is("deletedAt", null);
      return { status, count: count ?? 0 };
    }),
  );

  const { data: viewsRows } = await db
    .from(TABLES.BlogPost)
    .select("views")
    .is("deletedAt", null);

  const totalViews = (viewsRows ?? []).reduce((sum, row) => sum + Number(row.views ?? 0), 0);

  const { count: approvedComments } = await db
    .from(TABLES.BlogComment)
    .select("id", { count: "exact", head: true })
    .eq("isApproved", true);

  const pendingComments = await countPendingComments();
  const categoriesResult = await listBlogCategories({
    page: 1,
    pageSize: 100,
    sortBy: "postsCount",
    sortOrder: "desc",
  });

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c.count]));

  return {
    posts: {
      total: counts.reduce((s, c) => s + c.count, 0),
      published: countMap[BlogPostStatus.PUBLISHED] ?? 0,
      draft: countMap[BlogPostStatus.DRAFT] ?? 0,
      archived: countMap[BlogPostStatus.ARCHIVED] ?? 0,
      scheduled: countMap[BlogPostStatus.SCHEDULED] ?? 0,
      totalViews,
    },
    comments: {
      pending: pendingComments,
      approved: approvedComments ?? 0,
    },
    categories: categoriesResult.items.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      postsCount: c.postsCount,
    })),
  };
}
