import {
  BlogCategoriesWidget,
  BlogMostReadWidget,
  BlogTagCloud,
} from "@/components/blog/blog-widgets";
import { BlogSearchWidget } from "@/components/blog/blog-sidebar-widgets";
import {
  formatReadingTime,
  getPostCoverImage,
  type PublicBlogPost,
  type TocHeading,
} from "@/lib/blog/public-utils";
import type { BlogCategory } from "@/lib/types/database";
import { Clock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BlogSidebar({
  categories,
  mostRead,
  tags,
  activeCategorySlug,
}: {
  categories: BlogCategory[];
  mostRead: PublicBlogPost[];
  tags: Array<{ name: string; count: number }>;
  activeCategorySlug?: string;
}) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
      <BlogSearchWidget />
      <BlogCategoriesWidget categories={categories} activeSlug={activeCategorySlug} />
      <BlogMostReadWidget posts={mostRead} />
      <BlogTagCloud tags={tags.slice(0, 15)} />
    </aside>
  );
}

function SidebarRelatedPost({ post }: { post: PublicBlogPost }) {
  const cover = getPostCoverImage(post);

  return (
    <li>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex gap-3 rounded-xl p-2 transition hover:bg-[var(--secondary)]/50"
      >
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-[var(--color-card-border)]">
          <Image
            src={cover}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="80px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="line-clamp-2 text-sm font-medium leading-snug text-[var(--color-brown)] transition group-hover:text-[var(--color-cta)]">
            {post.title}
          </span>
          {post.readingTime != null && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
              <Clock className="h-3 w-3" />
              {formatReadingTime(post.readingTime)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export function BlogPostSidebar({
  categories,
  toc,
  relatedPosts,
}: {
  categories: BlogCategory[];
  toc: TocHeading[];
  relatedPosts: PublicBlogPost[];
}) {
  return (
    <aside className="hidden space-y-6 lg:block lg:sticky lg:top-24 lg:self-start">
      {toc.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
          <p className="label-caps">Navegação</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-brown)]">
            Neste artigo
          </h2>
          <nav aria-label="Sumário" className="mt-4 max-h-[min(50vh,320px)] overflow-y-auto pr-1">
            <ul className="space-y-1 text-sm">
              {toc.map((heading) => (
                <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}>
                  <a
                    href={`#${heading.id}`}
                    className="block rounded-lg px-2 py-1.5 text-[var(--muted-foreground)] transition hover:bg-[var(--secondary)] hover:text-[var(--color-cta)]"
                  >
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      {relatedPosts.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
          <p className="label-caps">Relacionados</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-[var(--color-brown)]">
            Leia também
          </h2>
          <ul className="mt-3 space-y-1">
            {relatedPosts.map((post) => (
              <SidebarRelatedPost key={post.id} post={post} />
            ))}
          </ul>
        </div>
      )}
      <BlogCategoriesWidget categories={categories} />
    </aside>
  );
}
