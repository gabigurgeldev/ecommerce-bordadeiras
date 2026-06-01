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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-semibold text-white">Blog</h1>
      <p className="mt-2 text-zinc-400">Conteúdo para o seu ateliê crescer</p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-zinc-900"
          >
            <Link href={`/blog/${post.slug}`} className="relative block aspect-video">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 33vw"
                loading="lazy"
              />
            </Link>
            <div className="p-6">
              <time className="text-xs text-zinc-500">
                {formatDate(post.publishedAt)}
              </time>
              <h2 className="mt-2 text-lg font-semibold">
                <Link href={`/blog/${post.slug}`} className="hover:text-rose-600">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {post.excerpt}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
