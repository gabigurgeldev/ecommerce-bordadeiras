import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data/blog";
import { formatDate } from "@/lib/format";
import { blogPostJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};
  return buildMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.coverImage,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    getBlogPostBySlug(slug),
    getBlogPosts(),
  ]);
  if (!post) notFound();

  const recent = allPosts.filter((p) => p.slug !== post.slug).slice(0, 4);
  const tags = Array.from(new Set(allPosts.flatMap((p) => p.tags ?? []))).slice(
    0,
    8,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLdScript data={blogPostJsonLd(post)} />

      <nav className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
        <Link href="/" className="transition hover:text-[var(--color-cta)]">
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" className="transition hover:text-[var(--color-cta)]">
          Blog
        </Link>
        <span>/</span>
        <span className="truncate text-[var(--color-brown)]">{post.title}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article className="mx-auto w-full max-w-[680px]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-cta)] transition hover:text-[var(--color-cta-hover)]"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar para o blog
          </Link>

          <header className="mt-6">
            {post.tags?.[0] && (
              <span className="rounded-full bg-[var(--color-green)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                {post.tags[0]}
              </span>
            )}
            <h1 className="mt-4 font-display text-[clamp(1.875rem,5vw,2.75rem)] font-semibold leading-tight tracking-tight text-[var(--color-brown)]">
              {post.title}
            </h1>
            <p className="mt-3 text-sm text-[var(--muted-foreground)]">
              Por {post.author} ·{" "}
              <time>{formatDate(post.publishedAt)}</time>
            </p>
          </header>

          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl border border-[var(--color-card-border)]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width:1024px) 100vw, 680px"
            />
          </div>

          <div
            className="mt-10 max-w-none text-[var(--foreground)]/85 [&_a]:text-[var(--color-cta)] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--color-price)] [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-[var(--color-brown)] [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[var(--color-brown)] [&_img]:rounded-xl [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          {recent.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">
                Posts recentes
              </h2>
              <ul className="mt-4 space-y-4">
                {recent.map((p) => (
                  <li key={p.id}>
                    <Link href={`/blog/${p.slug}`} className="group flex gap-3">
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={p.coverImage}
                          alt={p.title}
                          fill
                          className="object-cover"
                          sizes="56px"
                          loading="lazy"
                        />
                      </span>
                      <span>
                        <span className="line-clamp-2 text-sm font-medium text-[var(--color-brown)] transition group-hover:text-[var(--color-cta)]">
                          {p.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                          {formatDate(p.publishedAt)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tags.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm">
              <h2 className="font-display text-lg font-semibold text-[var(--color-brown)]">
                Categorias
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--color-brown)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
