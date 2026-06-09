import { Suspense } from "react";
import { listBlogPosts, listBlogCategories, listBlogTags } from "@/actions/admin/blog";
import { PageHeader } from "@/components/admin/page-header";
import { BlogAdminView } from "@/components/admin/blog-admin-view";

export default async function AdminBlogPage() {
  const [posts, categories, tags] = await Promise.all([
    listBlogPosts(),
    listBlogCategories(),
    listBlogTags(),
  ]);

  return (
    <div>
      <PageHeader title="Blog" description="Posts, categorias e tags" />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando…</div>}>
        <BlogAdminView
          posts={posts.map((post) => {
            const row = post as Record<string, unknown>;
            const category = (row.BlogCategory ?? row.category) as { name?: string } | null;
            const postTags = (row.BlogPostTag ?? []) as Array<{
              BlogTag?: { id: string };
              tag?: { id: string };
            }>;
            const tagIds = postTags
              .map((pt) => pt.BlogTag?.id ?? pt.tag?.id)
              .filter((id): id is string => Boolean(id));
            return {
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              coverImage: post.coverImage,
              published: post.published,
              seoTitle: post.seoTitle,
              seoDescription: post.seoDescription,
              categoryId: post.categoryId,
              tagIds,
              updatedAt: post.updatedAt,
              categoryName: category?.name ?? null,
            };
          })}
          categories={categories}
          tags={tags}
        />
      </Suspense>
    </div>
  );
}
