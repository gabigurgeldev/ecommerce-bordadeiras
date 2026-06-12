"use server";

import { revalidatePath } from "next/cache";
import {
  getCachedPostBySlug,
  incrementBlogPostViews,
  listBlogPosts,
} from "@/lib/blog/blog-post-service";
import { getCachedActiveBlogCategories } from "@/lib/blog/blog-category-service";
import {
  submitBlogComment,
  listApprovedCommentsForPost,
} from "@/lib/blog/blog-comment-service";
import { searchBlog } from "@/lib/blog/blog-search-service";
import { buildBlogMetaTags } from "@/lib/blog/blog-seo-service";
import { blogCommentInputSchema, blogListQuerySchema, blogSearchQuerySchema } from "@/lib/validations/blog";
import { headers } from "next/headers";
import { rateLimitBlogComment, rateLimitBlogView } from "@/lib/rate-limit";

export type BlogActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function serializeForClient<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getPublicBlogPosts(query?: Record<string, string | undefined>) {
  const parsed = blogListQuerySchema.safeParse({
    ...(query ?? {}),
    publicOnly: true,
    includeDeleted: false,
  });
  const params = parsed.success
    ? { ...parsed.data, publicOnly: true as const, includeDeleted: false as const }
    : {
        page: 1,
        pageSize: 12,
        sortBy: "publishedAt" as const,
        sortOrder: "desc" as const,
        publicOnly: true as const,
        includeDeleted: false as const,
      };

  const result = await listBlogPosts(params);
  return serializeForClient(result);
}

export async function getPublicBlogCategoryBySlug(slug: string) {
  const categories = await getPublicBlogCategories();
  return serializeForClient(categories.find((c) => c.slug === slug) ?? null);
}

export async function getPublicBlogPost(slug: string) {
  const post = await getCachedPostBySlug(slug);
  if (!post) return null;
  return serializeForClient({
    post,
    meta: buildBlogMetaTags(post),
  });
}

export async function getPublicBlogCategories() {
  const result = await getCachedActiveBlogCategories();
  return serializeForClient(result.items);
}

export async function searchPublicBlog(query: Record<string, string | undefined>) {
  const parsed = blogSearchQuerySchema.safeParse(query);
  if (!parsed.success) {
    return { posts: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }, categories: { items: [], total: 0, page: 1, pageSize: 10, totalPages: 1 } };
  }
  const result = await searchBlog(parsed.data);
  return serializeForClient(result);
}

export async function getPublicBlogComments(postId: string) {
  const comments = await listApprovedCommentsForPost(postId);
  return serializeForClient(comments);
}

export async function submitPublicBlogComment(
  input: unknown,
): Promise<BlogActionResult<{ id: string }>> {
  const parsed = blogCommentInputSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return { success: false, error: msg };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const limited = await rateLimitBlogComment(ip);
  if (!limited.success) {
    return { success: false, error: "Muitos comentários enviados. Tente novamente em alguns minutos." };
  }

  try {
    const result = await submitBlogComment(parsed.data);
    revalidatePath("/blog");
    return { success: true, data: result };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Não foi possível enviar o comentário",
    };
  }
}

export async function trackBlogPostView(slug: string): Promise<void> {
  const post = await getCachedPostBySlug(slug);
  if (!post) return;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  const limited = await rateLimitBlogView(`${ip}:${slug}`);
  if (!limited.success) return;

  await incrementBlogPostViews(post.id);
}
