import { adminListBlogCategories, adminListBlogPosts } from "@/actions/admin/blog-ext";
import { BlogPostsList } from "@/components/admin/blog/blog-posts-list";
import { mapPostRow } from "@/components/admin/blog/blog-utils";
import { PageHeader } from "@/components/admin/page-header";
import { AdminPageContainer } from "@/components/admin/admin-page-container";
import type { BlogCategory, BlogPostWithRelations } from "@/lib/types/database";

export default async function AdminBlogPostsPage() {
  const [postsResult, categoriesResult] = await Promise.all([
    adminListBlogPosts({ page: 1, pageSize: 100, sortBy: "updatedAt", sortOrder: "desc" }),
    adminListBlogCategories({ page: 1, pageSize: 100 }),
  ]);

  const postsRaw = (postsResult as { items?: BlogPostWithRelations[] }).items ?? [];
  const posts = postsRaw.map((p) => mapPostRow(p));
  const categories = ((categoriesResult as { items?: BlogCategory[] }).items ?? []) as BlogCategory[];

  return (
    <AdminPageContainer>
      <PageHeader title="Posts do blog" description="Gerencie artigos, rascunhos e publicações" />
      <BlogPostsList posts={posts} categories={categories} />
    </AdminPageContainer>
  );
}
