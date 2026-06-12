import { BlogAuthorAvatar } from "@/components/blog/blog-author-avatar";
import {
  formatReadingTime,
  getAuthorName,
  getPostCoverImage,
  type PublicBlogPost,
} from "@/lib/blog/public-utils";
import { formatDate } from "@/lib/format";
import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BlogFeaturedHero({ post }: { post: PublicBlogPost }) {
  const cover = getPostCoverImage(post);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-white shadow-sm">
      <div className="grid lg:grid-cols-2">
        <Link
          href={`/blog/${post.slug}`}
          className="relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[360px]"
        >
          <Image
            src={cover}
            alt={post.title}
            fill
            className="object-cover transition duration-700 hover:scale-105"
            sizes="(max-width:1024px) 100vw, 50vw"
            priority
          />
          {post.youtubeUrl && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/15">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-2xl text-[var(--color-brown)] shadow-xl">
                ▶
              </span>
            </span>
          )}
        </Link>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="text-section-subtitle">Destaque</p>
          {post.category && (
            <Link
              href={`/blog/categoria/${post.category.slug}`}
              className="mt-2 w-fit rounded-full bg-[var(--color-green)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:opacity-90"
            >
              {post.category.name}
            </Link>
          )}
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-semibold leading-tight tracking-tight text-[var(--color-brown)]">
            <Link href={`/blog/${post.slug}`} className="link-muted transition">
              {post.title}
            </Link>
          </h2>
          {post.excerpt && (
            <p className="mt-3 line-clamp-4 text-[var(--muted-foreground)]">{post.excerpt}</p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[var(--muted-foreground)]">
            <div className="flex items-center gap-2">
              <BlogAuthorAvatar post={post} size="sm" />
              <span className="font-medium text-[var(--color-brown)]">{getAuthorName(post)}</span>
            </div>
            {post.publishedAt && (
              <time dateTime={String(post.publishedAt)}>{formatDate(post.publishedAt)}</time>
            )}
            {post.readingTime != null && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatReadingTime(post.readingTime)}
              </span>
            )}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className="link-muted mt-6 inline-flex w-fit text-sm font-semibold"
          >
            Ler artigo completo →
          </Link>
        </div>
      </div>
    </section>
  );
}
