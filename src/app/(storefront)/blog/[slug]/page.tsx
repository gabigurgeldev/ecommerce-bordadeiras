import { BlogAuthorAvatar } from "@/components/blog/blog-author-avatar";
import { BlogBreadcrumb } from "@/components/blog/blog-breadcrumb";
import { BlogCommentsSection } from "@/components/blog/blog-comments";
import { BlogMobileToc } from "@/components/blog/blog-mobile-toc";
import { BlogPostHeader } from "@/components/blog/blog-post-header";
import { BlogPostHero } from "@/components/blog/blog-post-hero";
import { BlogRelatedPosts } from "@/components/blog/blog-related-posts";
import { BlogPostSidebar } from "@/components/blog/blog-sidebar";
import { BlogArticleContent } from "@/components/blog/blog-reading-mode";
import { BlogReadingProgress } from "@/components/blog/blog-reading-progress";
import { BlogShareButtons } from "@/components/blog/blog-share-buttons";
import { BlogViewTracker } from "@/components/blog/blog-view-tracker";
import { BlogYouTubeEmbed } from "@/components/blog/blog-youtube-embed";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  getPublicBlogCategories,
  getPublicBlogComments,
  getPublicBlogPost,
  getPublicBlogPosts,
} from "@/actions/blog";
import { ARTICLE_PROSE_CLASS } from "@/lib/blog/article-prose";
import {
  extractHeadingsFromHtml,
  getAuthorName,
  getPostCoverImage,
  getPostShareUrl,
  getPostTags,
  prepareArticleHtml,
} from "@/lib/blog/public-utils";
import { blogArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicBlogPost(slug).catch(() => null);
  if (!data) return {};
  const { post, meta } = data;
  const authorName = getAuthorName(post);
  return buildMetadata({
    title: meta.openGraph.title,
    description: meta.description,
    path: `/blog/${slug}`,
    image: meta.openGraph.images[0]?.url,
    type: "article",
    publishedTime: post.publishedAt
      ? new Date(String(post.publishedAt)).toISOString()
      : undefined,
    modifiedTime: new Date(String(post.updatedAt)).toISOString(),
    authors: [authorName],
    rssPath: "/blog/rss.xml",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPublicBlogPost(slug);
  if (!data) notFound();

  const { post } = data;
  const cover = getPostCoverImage(post);
  const tags = getPostTags(post);
  const contentWithIds = prepareArticleHtml(post.content);
  const toc = extractHeadingsFromHtml(contentWithIds);
  const shareUrl = getPostShareUrl(slug);

  const breadcrumbItems = [
    { name: "Página inicial", path: "/" },
    { name: "Blog", path: "/blog" },
    ...(post.category
      ? [{ name: post.category.name, path: `/blog/categoria/${post.category.slug}` }]
      : []),
    { name: post.title, path: `/blog/${slug}` },
  ];

  const categorySlug = post.category?.slug;
  const [comments, categories, relatedResult] = await Promise.all([
    getPublicBlogComments(post.id),
    getPublicBlogCategories(),
    getPublicBlogPosts({
      page: "1",
      pageSize: "4",
      categorySlug: categorySlug ?? undefined,
      sortBy: "publishedAt",
      sortOrder: "desc",
    }),
  ]);

  const relatedPosts = relatedResult.items.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <link rel="preload" as="image" href={cover} />
      <JsonLdScript data={blogArticleJsonLd(post, { coverImage: cover, authorName: getAuthorName(post) })} />
      <JsonLdScript data={breadcrumbJsonLd(breadcrumbItems)} />
      <BlogReadingProgress />
      <BlogViewTracker slug={slug} />

      <article className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-8">
        <BlogBreadcrumb
          items={[
            { label: "Página inicial", href: "/" },
            { label: "Blog", href: "/blog" },
            ...(post.category
              ? [{ label: post.category.name, href: `/blog/categoria/${post.category.slug}` }]
              : []),
            { label: post.title },
          ]}
        />

        <div className="mt-6 lg:mt-8">
          <BlogPostHeader post={post} />
        </div>

        <BlogPostHero src={cover} alt={post.title} />

        <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <BlogMobileToc toc={toc} />

            {post.youtubeUrl && (
              <BlogYouTubeEmbed url={post.youtubeUrl} title={post.title} className="mt-8 lg:mt-0" />
            )}

            <BlogArticleContent html={contentWithIds} proseClass={ARTICLE_PROSE_CLASS} />

            {tags.length > 0 && (
              <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[var(--color-card-border)] pt-8">
                <span className="label-caps mr-1">Tags</span>
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/busca?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--color-brown)] transition hover:bg-[var(--color-price)]/20"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-2xl border border-[var(--color-card-border)] bg-white p-5 shadow-sm sm:p-6">
              <BlogShareButtons url={shareUrl} title={post.title} />
            </div>

            <BlogCommentsSection postId={post.id} comments={comments} />
          </div>

          <BlogPostSidebar categories={categories} toc={toc} relatedPosts={relatedPosts} />
        </div>

        <BlogRelatedPosts posts={relatedPosts} />
      </article>
    </>
  );
}
