import { BookOpen } from "lucide-react";
import Link from "next/link";
import type { BlogCategory } from "@/lib/types/database";

export function BlogEmptyState({
  title = "Nenhum artigo encontrado",
  description = "Volte em breve — estamos preparando novos conteúdos para você.",
  actionHref = "/blog",
  actionLabel = "Voltar ao blog",
}: {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-card-border)] bg-white px-6 py-16 text-center transition-opacity duration-500">
      <BookOpen className="h-12 w-12 animate-pulse text-[var(--color-price)]/60" aria-hidden />
      <h2 className="mt-4 font-display text-xl font-semibold text-[var(--color-brown)]">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--muted-foreground)]">{description}</p>
      <Link
        href={actionHref}
        className="link-muted mt-6 inline-flex rounded-sm text-sm font-semibold transition hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2"
      >
        {actionLabel} →
      </Link>
    </div>
  );
}

export function BlogCategoriesWidget({
  categories,
  activeSlug,
}: {
  categories: BlogCategory[];
  activeSlug?: string;
}) {
  if (!categories.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">Categorias</h2>
      <ul className="mt-4 space-y-1">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/blog/categoria/${cat.slug}`}
              className={`flex min-h-[40px] items-center justify-between rounded-lg px-3 text-sm transition hover:bg-[var(--secondary)] ${
                activeSlug === cat.slug
                  ? "bg-[var(--secondary)] font-semibold text-[var(--color-cta)]"
                  : "text-[var(--color-brown)]"
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-[var(--muted-foreground)]">{cat.postsCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BlogMostReadWidget({ posts }: { posts: import("@/lib/blog/public-utils").PublicBlogPost[] }) {
  if (!posts.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">Mais lidos</h2>
      <ol className="mt-4 space-y-3">
        {posts.map((post, index) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`} className="group flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-bold text-[var(--color-brown)]">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-medium text-[var(--color-brown)] transition group-hover:text-[var(--color-cta)]">
                  {post.title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                  {post.views ?? 0} visualizações
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function BlogTagCloud({ tags }: { tags: Array<{ name: string; count: number }> }) {
  if (!tags.length) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">Tags</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.name}
            href={`/blog/busca?q=${encodeURIComponent(tag.name)}`}
            className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--color-brown)] transition hover:bg-[var(--color-price)]/20"
          >
            {tag.name}
            <span className="ml-1 text-[var(--muted-foreground)]">({tag.count})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
