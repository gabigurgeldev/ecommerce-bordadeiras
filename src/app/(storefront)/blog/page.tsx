import { formatDate } from "@/lib/format";
import { getBlogPosts } from "@/lib/data/blog";
import { buildMetadata } from "@/lib/seo/metadata";
import Image from "next/image";
import Link from "next/link";

export const metadata = buildMetadata({
  title: "Blog",
  description: "Dicas, manutenção e tendências de bordado.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <header className="text-center">
        <p className="text-section-subtitle">Diário do ateliê</p>
        <h1 className="mt-1 font-display text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight text-[var(--color-brown)]">
          Blog
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted-foreground)]">
          Conteúdo, técnicas e inspiração para o seu bordado crescer.
        </p>
      </header>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--color-card-border)] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[var(--color-brown)]/10"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="relative block aspect-video overflow-hidden"
            >
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"
                loading="lazy"
              />
              {post.tags?.[0] && (
                <span className="absolute left-3 top-3 rounded-full bg-[var(--color-green)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow">
                  {post.tags[0]}
                </span>
              )}
            </Link>
            <div className="flex flex-1 flex-col p-6">
              <time className="text-xs font-medium uppercase tracking-wide text-[var(--color-price)]">
                {formatDate(post.publishedAt)}
              </time>
              <h2 className="mt-2 font-display text-xl font-semibold leading-snug text-[var(--color-brown)]">
                <Link
                  href={`/blog/${post.slug}`}
                  className="link-muted transition"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-[var(--muted-foreground)]">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="link-muted mt-4 inline-flex w-fit text-sm font-semibold"
              >
                Ler artigo →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
