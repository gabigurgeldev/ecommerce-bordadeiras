import { notFound, redirect } from "next/navigation";
import { getBlogPost } from "@/actions/admin/blog";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getBlogPost(id);
  if (!post) notFound();
  redirect(`/admin/blog?edit=${id}`);
}
