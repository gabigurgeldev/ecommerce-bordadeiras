import { notFound } from "next/navigation";
import { getBlogPost, listBlogCategories, listBlogTags } from "@/actions/admin/blog";
import { PageHeader } from "@/components/admin/page-header";
import { BlogPostForm } from "@/components/admin/blog-post-form";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post, categories, tags] = await Promise.all([
    getBlogPost(id),
    listBlogCategories(),
    listBlogTags(),
  ]);

  if (!post) notFound();

  return (
    <div>
      <PageHeader title="Editar post" description={post.title} />
      <BlogPostForm post={post} categories={categories} tags={tags} />
    </div>
  );
}
