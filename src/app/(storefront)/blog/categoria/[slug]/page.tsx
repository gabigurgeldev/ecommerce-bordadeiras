import { BlogBreadcrumb } from "@/components/blog/blog-breadcrumb";
import { BlogEmptyState } from "@/components/blog/blog-widgets";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import {
  getPublicBlogCategories,
  getPublicBlogCategoryBySlug,
  getPublicBlogPosts,
} from "@/actions/blog";
import { collectTagsFromPosts } from "@/lib/blog/public-utils";
import { blogListingJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const category = await getPublicBlogCategoryBySlug(slug);
  if (!category) return {};
  const path = page > 1 ? `/blog/categoria/${slug}?page=${page}` : `/blog/categoria/${slug}`;
  return buildMetadata({
    title: category.name,
    description: category.description ?? `Artigos sobre ${category.name}.`,
    path,
    rssPath: "/blog/rss.xml",
  });
}

export default async function BlogCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const category = await getPublicBlogCategoryBySlug(slug);
  if (!category) notFound();

  const [postsResult, mostReadResult, categories] = await Promise.all([
    getPublicBlogPosts({
      page: String(page),
      pageSize: "12",
      categorySlug: slug,
      sortBy: "publishedAt",
      sortOrder: "desc",
    }),
    getPublicBlogPosts({
      page: "1",
      pageSize: "5",
      sortBy: "views",
      sortOrder: "desc",
    }),
    getPublicBlogCategories(),
  ]);

  const tags = collectTagsFromPosts([...postsResult.items, ...mostReadResult.items]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLdScript
        data={blogListingJsonLd({
          name: `${category.name} — Blog`,
          description: category.description ?? `Artigos sobre ${category.name}.`,
          path: `/blog/categoria/${slug}`,
        })}
      />
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Página inicial", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: category.name, path: `/blog/categoria/${slug}` },
        ])}
      />
      <BlogBreadcrumb
        items={[
          { label: "Página inicial", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: category.name },
        ]}
      />

      <header className="mt-8 text-center sm:text-left">
        <p className="text-section-subtitle">Categoria</p>
        <div className="mt-2 rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {category.icon && (
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-3xl"
                aria-hidden
              >
                {category.icon}
              </span>
            )}
            <div className="text-center sm:text-left">
              <h1 className="font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-tight text-[var(--color-brown)]">
                {category.name}
              </h1>
              {category.description && (
                <p className="mx-auto mt-2 max-w-2xl text-[var(--muted-foreground)] sm:mx-0">
                  {category.description}
                </p>
              )}
              <p className="mt-3 inline-flex rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--color-brown)]">
                {category.postsCount} artigo{category.postsCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {postsResult.items.length > 0 ? (
            <>
              <div className="grid gap-8 sm:grid-cols-2">
                {postsResult.items.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
              <BlogPagination
                page={page}
                totalPages={postsResult.totalPages}
                basePath={`/blog/categoria/${slug}`}
              />
            </>
          ) : (
            <BlogEmptyState
              title="Nenhum artigo nesta categoria"
              description="Ainda não há publicações aqui. Confira outras categorias."
              actionHref="/blog"
            />
          )}
        </div>

        <BlogSidebar
          categories={categories}
          mostRead={mostReadResult.items}
          tags={tags}
          activeCategorySlug={slug}
        />
      </div>
    </div>
  );
}
