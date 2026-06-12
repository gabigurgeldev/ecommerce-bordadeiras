import { adminListBlogCategories } from "@/actions/admin/blog-ext";
import { listBlogTags } from "@/actions/admin/blog";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";
import type { BlogCategory } from "@/lib/types/database";

export default async function CreateBlogPostPage() {
  const [categoriesResult, tags] = await Promise.all([
    adminListBlogCategories({ page: 1, pageSize: 100 }),
    listBlogTags(),
  ]);

  const categories = ((categoriesResult as { items?: BlogCategory[] }).items ?? []) as BlogCategory[];

  return <BlogPostEditor categories={categories} tags={tags} />;
}
