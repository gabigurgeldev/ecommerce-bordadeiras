import { BlogPostCard } from "@/components/blog/blog-post-card";
import { SectionHeader } from "@/components/home/section-header";
import type { PublicBlogPost } from "@/lib/blog/public-utils";
import Link from "next/link";

export function BlogCategorySection({
  categoryName,
  categorySlug,
  posts,
}: {
  categoryName: string;
  categorySlug: string;
  posts: PublicBlogPost[];
}) {
  if (!posts.length) return null;

  return (
    <section className="mt-14">
      <SectionHeader
        title={categoryName}
        align="left"
        action={
          <Link
            href={`/blog/categoria/${categorySlug}`}
            className="link-muted text-sm font-semibold"
          >
            Ver todos →
          </Link>
        }
      />
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
