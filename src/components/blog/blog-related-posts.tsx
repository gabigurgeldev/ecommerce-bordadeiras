import { BlogPostCard } from "@/components/blog/blog-post-card";
import type { PublicBlogPost } from "@/lib/blog/public-utils";

export function BlogRelatedPosts({ posts }: { posts: PublicBlogPost[] }) {
  if (!posts.length) return null;

  return (
    <section
      className="mt-16 border-t border-[var(--color-card-border)] pt-12 sm:mt-20 sm:pt-14"
      aria-labelledby="related-posts-heading"
    >
      <p className="text-section-subtitle">Continue lendo</p>
      <h2
        id="related-posts-heading"
        className="mt-1 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-[var(--color-brown)]"
      >
        Artigos relacionados
      </h2>
      <p className="mt-2 max-w-xl text-sm text-[var(--muted-foreground)]">
        Mais conteúdo selecionado para você aprofundar o tema.
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
