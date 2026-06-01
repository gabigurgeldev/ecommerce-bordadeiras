import { listBlogCategories, listBlogTags } from "@/actions/admin/blog";
import { PageHeader } from "@/components/admin/page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function NewBlogPostPage() {
  const [categories, tags] = await Promise.all([listBlogCategories(), listBlogTags()]);

  return (
    <div>
      <PageHeader title="Novo post" />
      <BlogPostForm categories={categories} tags={tags} />
    </div>
  );
}
