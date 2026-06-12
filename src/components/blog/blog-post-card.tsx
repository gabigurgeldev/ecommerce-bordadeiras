import { BlogAuthorAvatar } from "@/components/blog/blog-author-avatar";
import {
  formatReadingTime,
  formatViewCount,
  getAuthorName,
  getPostCoverImage,
  getPostTags,
  type PublicBlogPost,
} from "@/lib/blog/public-utils";
import { formatDate } from "@/lib/format";
import { Clock, Eye, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Props = {
  post: PublicBlogPost;
  priority?: boolean;
  highlightQuery?: string;
};

export function BlogPostCard({ post, priority = false, highlightQuery }: Props) {
  const cover = getPostCoverImage(post);
  const category = post.category;
  const tags = getPostTags(post);
  const title = post.title;
  const excerpt = post.excerpt ?? "";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-price)]/30 hover:shadow-lg hover:shadow-[var(--color-brown)]/8">
      <Link
        href={`/blog/${post.slug}`}
        className="relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2"
      >
        <Image
          src={cover}
          alt={title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width:768px) 100vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80 transition group-hover:opacity-100"
          aria-hidden
        />
        {post.youtubeUrl && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[var(--color-brown)] shadow-lg transition group-hover:scale-110">
              <Play className="h-4 w-4 fill-current pl-0.5" aria-hidden />
            </span>
          </span>
        )}
        {(category || tags[0]) && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-green)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
            {category?.name ?? tags[0]}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
          {post.publishedAt && (
            <time dateTime={String(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
          )}
          {post.readingTime != null && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatReadingTime(post.readingTime)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViewCount(post.views ?? 0)}
          </span>
        </div>

        <h2 className="mt-2.5 font-display text-lg font-semibold leading-snug text-[var(--color-brown)] sm:text-xl">
          <Link
            href={`/blog/${post.slug}`}
            className="link-muted line-clamp-2 rounded-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cta)] focus-visible:ring-offset-2"
          >
            {highlightQuery ? (
              <span dangerouslySetInnerHTML={{ __html: highlightQuery }} />
            ) : (
              title
            )}
          </Link>
        </h2>

        {excerpt && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {excerpt}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-card-border)] pt-4">
          <BlogAuthorAvatar post={post} size="sm" />
          <span className="text-sm font-medium text-[var(--color-brown)]">{getAuthorName(post)}</span>
        </div>
      </div>
    </article>
  );
}
