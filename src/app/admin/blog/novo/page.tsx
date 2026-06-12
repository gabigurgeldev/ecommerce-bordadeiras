import { redirect } from "next/navigation";

export default function LegacyNewBlogPostPage() {
  redirect("/admin/blog/posts/create");
}
