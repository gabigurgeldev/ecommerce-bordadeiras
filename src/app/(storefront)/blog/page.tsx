import { BlogCategorySection } from "@/components/blog/blog-category-section";
import { BlogEmptyState } from "@/components/blog/blog-widgets";
import { BlogFeaturedHero } from "@/components/blog/blog-featured-hero";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { SectionHeader } from "@/components/home/section-header";
import {
  getPublicBlogCategories,
  getPublicBlogPosts,
} from "@/actions/blog";
import { collectTagsFromPosts } from "@/lib/blog/public-utils";
import { buildMetadata } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { blogListingJsonLd } from "@/lib/seo/json-ld";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Blog",
  description: "Dicas, manutenção e tendências de bordado.",
  path: "/blog",
  rssPath: "/blog/rss.xml",
});

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const pageSize = 9;

  const [featuredResult, postsResult, mostReadResult, categories] = await Promise.all([
    page === 1
      ? getPublicBlogPosts({
          page: "1",
          pageSize: "1",
          sortBy: "publishedAt",
          sortOrder: "desc",
        })
      : Promise.resolve({ items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }),
    getPublicBlogPosts({
      page: String(page),
      pageSize: String(pageSize),
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

  const featured = page === 1 ? featuredResult.items[0] ?? null : null;
  const gridPosts =
    featured != null
      ? postsResult.items.filter((p) => p.id !== featured.id)
      : postsResult.items;

  const tagSource = [...postsResult.items, ...mostReadResult.items, ...(featured ? [featured] : [])];
  const tags = collectTagsFromPosts(tagSource);

  const categorySections = await Promise.all(
    categories
      .filter((c) => c.postsCount > 0)
      .slice(0, 4)
      .map(async (cat) => {
        const result = await getPublicBlogPosts({
          categorySlug: cat.slug,
          pageSize: "3",
          sortBy: "publishedAt",
          sortOrder: "desc",
        });
        return { category: cat, posts: result.items };
      }),
  );

  const totalPages = postsResult.totalPages;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <JsonLdScript
        data={blogListingJsonLd({
          name: "Blog Bordadeiras",
          description: "Dicas, manutenção e tendências de bordado.",
          path: "/blog",
        })}
      />
      <header className="text-center">
        <p className="text-section-subtitle">Diário do ateliê</p>
        <h1 className="mt-1 font-display text-[clamp(2rem,5vw,3rem)] font-semibold tracking-tight text-[var(--color-brown)]">
          Blog
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[var(--muted-foreground)]">
          Conteúdo, técnicas e inspiração para o seu bordado crescer.
        </p>
      </header>

      {postsResult.total === 0 ? (
        <div className="mt-12">
          <BlogEmptyState />
        </div>
      ) : (
        <>
          {featured && page === 1 && (
            <div className="mt-10">
              <BlogFeaturedHero post={featured} />
            </div>
          )}

          <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <SectionHeader
                title={page === 1 ? "Artigos recentes" : `Artigos — página ${page}`}
                align="left"
              />
              {gridPosts.length > 0 ? (
                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  {gridPosts.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="mt-8">
                  <BlogEmptyState title="Nenhum artigo nesta página" />
                </div>
              )}

              <BlogPagination page={page} totalPages={totalPages} basePath="/blog" />

              {page === 1 &&
                categorySections.map(({ category, posts }) =>
                  posts.length > 0 ? (
                    <BlogCategorySection
                      key={category.id}
                      categoryName={category.name}
                      categorySlug={category.slug}
                      posts={posts}
                    />
                  ) : null,
                )}
            </div>

            <BlogSidebar
              categories={categories}
              mostRead={mostReadResult.items}
              tags={tags}
            />
          </div>
        </>
      )}
    </div>
  );
}
