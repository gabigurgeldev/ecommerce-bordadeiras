import { mockBlogPosts } from "@/lib/mock/catalog";
import { mapBlogPost } from "@/lib/data/mappers";
import { prisma } from "@/lib/prisma";
import type { BlogPost } from "@/lib/types/catalog";

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    });
    if (posts.length > 0) return posts.map(mapBlogPost);
  } catch {
    /* mock fallback */
  }
  return [...mockBlogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const post = await prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
    if (post) return mapBlogPost(post);
  } catch {
    /* mock fallback */
  }
  return mockBlogPosts.find((p) => p.slug === slug) ?? null;
}
