import { BlogAuthorAvatar } from "@/components/blog/blog-author-avatar";
import {
  formatReadingTime,
  formatViewCount,
  getAuthorName,
  type PublicBlogPost,
} from "@/lib/blog/public-utils";
import { formatDate } from "@/lib/format";
import { Calendar, Clock, Eye } from "lucide-react";
import Link from "next/link";

export function BlogPostHeader({ post }: { post: PublicBlogPost }) {
  const authorName = getAuthorName(post);

  return (
    <header className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-none lg:text-left">
      {post.category && (
        <Link
          href={`/blog/categoria/${post.category.slug}`}
          className="inline-flex rounded-full bg-[var(--color-green)] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm transition hover:opacity-90"
        >
          {post.category.name}
        </Link>
      )}

      <h1 className="mt-4 font-display text-[clamp(1.875rem,5vw,2.875rem)] font-semibold leading-[1.12] tracking-tight text-[var(--color-brown)]">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-[var(--color-brown-muted)] sm:text-xl sm:leading-relaxed">
          {post.excerpt}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[var(--color-card-border)] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-3 sm:p-5">
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <BlogAuthorAvatar post={post} size="md" />
          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
              Escrito por
            </p>
            <p className="font-display text-base font-semibold text-[var(--color-brown)]">
              {authorName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          {post.publishedAt && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-brown)]">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" aria-hidden />
              <time dateTime={String(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
            </span>
          )}
          {post.readingTime != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-brown)]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" aria-hidden />
              {formatReadingTime(post.readingTime)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-brown)]">
            <Eye className="h-3.5 w-3.5 shrink-0 text-[var(--color-green)]" aria-hidden />
            {formatViewCount(post.views ?? 0)} visualizações
          </span>
        </div>
      </div>
    </header>
  );
}
