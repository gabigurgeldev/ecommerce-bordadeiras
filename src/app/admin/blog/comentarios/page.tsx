import { adminListBlogComments, adminListBlogPosts } from "@/actions/admin/blog-ext";
import { BlogCommentsList, type BlogCommentRow } from "@/components/admin/blog/blog-comments-list";
import { mapPostRow } from "@/components/admin/blog/blog-utils";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import type { BlogPostWithRelations } from "@/lib/types/database";

export default async function AdminBlogCommentsPage() {
  const [commentsResult, postsResult] = await Promise.all([
    adminListBlogComments({ page: 1, pageSize: 100, isApproved: "all" }),
    adminListBlogPosts({ page: 1, pageSize: 200 }),
  ]);

  const postsRaw = (postsResult as { items?: BlogPostWithRelations[] }).items ?? [];
  const postMap = new Map(postsRaw.map((p) => [String(p.id), mapPostRow(p)]));

  const commentsRaw = (commentsResult as { items?: Array<Record<string, unknown>> }).items ?? [];
  const comments: BlogCommentRow[] = commentsRaw.map((c) => {
    const postId = String(c.postId);
    const post = postMap.get(postId);
    return {
      id: String(c.id),
      postId,
      postTitle: post?.title ?? "Post removido",
      postSlug: post?.slug ?? "",
      authorName: String(c.authorName),
      authorEmail: String(c.authorEmail),
      content: String(c.content),
      isApproved: Boolean(c.isApproved),
      createdAt: String(c.createdAt),
    };
  });

  return (
    <AdminPageContainer>
      <PageHeader title="Comentários" description="Modere comentários dos leitores" />
      <BlogCommentsList comments={comments} />
    </AdminPageContainer>
  );
}
