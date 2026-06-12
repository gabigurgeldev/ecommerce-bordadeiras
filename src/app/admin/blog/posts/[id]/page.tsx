import { notFound } from "next/navigation";
import { adminGetBlogPost, adminListBlogCategories } from "@/actions/admin/blog-ext";
import { listBlogTags } from "@/actions/admin/blog";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";
import { mapPostRow } from "@/components/admin/blog/blog-utils";
import type { BlogCategory, BlogPostWithRelations } from "@/lib/types/database";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [postResult, categoriesResult, tags] = await Promise.all([
    adminGetBlogPost(id),
    adminListBlogCategories({ page: 1, pageSize: 100 }),
    listBlogTags(),
  ]);

  if (!postResult) notFound();

  const post = mapPostRow(postResult as BlogPostWithRelations);
  const categories = ((categoriesResult as { items?: BlogCategory[] }).items ?? []) as BlogCategory[];

  return <BlogPostEditor post={post} categories={categories} tags={tags} />;
}
