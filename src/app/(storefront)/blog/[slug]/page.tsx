import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { formatDate } from "@/lib/format";
import { blogPostJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import Image from "next/image";
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
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <JsonLdScript data={blogPostJsonLd(post)} />
      <header>
        <time className="text-sm text-zinc-500">{formatDate(post.publishedAt)}</time>
        <h1 className="font-display mt-4 text-4xl font-semibold text-white">
          {post.title}
        </h1>
        <p className="mt-2 text-zinc-400">Por {post.author}</p>
      </header>
      <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          priority
          sizes="768px"
        />
      </div>
      <div
        className="prose prose-zinc mt-10 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
