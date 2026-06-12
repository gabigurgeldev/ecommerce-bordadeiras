import {
  getBlogPostBySlugPublic,
  listBlogPosts,
} from "@/lib/blog/blog-post-service";
import type { BlogPost } from "@/lib/types/catalog";

function toCatalogPost(
  post: Awaited<ReturnType<typeof listBlogPosts>>["items"][number],
): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImage: post.coverImage ?? "",
    publishedAt: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    author: post.author?.name ?? "Equipe",
    tags: post.tags?.map((t) => t.tag?.name).filter(Boolean) as string[] | undefined,
  };
}

/** @deprecated Prefer `getPublicBlogPosts` from `@/actions/blog`. */
export async function getBlogPosts(): Promise<BlogPost[]> {
  const result = await listBlogPosts({
    page: 1,
    pageSize: 200,
    sortBy: "publishedAt",
    sortOrder: "desc",
    publicOnly: true,
    includeDeleted: false,
  });
  return result.items.map(toCatalogPost);
}

/** @deprecated Prefer `getPublicBlogPost` from `@/actions/blog`. */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const post = await getBlogPostBySlugPublic(slug);
  return post ? toCatalogPost(post) : null;
}
