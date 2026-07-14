import { revalidatePath, revalidateTag } from "next/cache";
import { unstable_cache } from "next/cache";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { mapBlogPostWithRelations } from "@/lib/blog/mappers";
import type { PaginatedResult } from "@/lib/blog/types";
import {
  buildPaginatedResult,
  calculateReadingTime,
  emptyToNull,
  generateUniqueSlug,
  parseListRange,
} from "@/lib/blog/utils";
import { BLOG_PUBLISHED_POST_FILTER } from "@/lib/types/blog";
import { BlogPostStatus } from "@/lib/types/database";
import type { BlogPostInput } from "@/lib/validations/blog";
import type { BlogListQuery } from "@/lib/validations/blog";
import { slugify } from "@/lib/utils";

export const BLOG_CACHE_TAG = "blog-posts";

/** Lightweight select for list/dashboard — avoids heavy embeds across many rows. */
const LIST_SELECT = "*, BlogCategory(*), BlogPostTag(*, BlogTag(*))";

/** Full select for single-post detail (edit screens). */
const POST_SELECT =
  "*, BlogCategory(*), BlogPostTag(*, BlogTag(*)), BlogMedia(*), BlogComment(*), BlogPostVersion(*)";

function resolveStatus(input: BlogPostInput): BlogPostStatus {
  if (input.status) return input.status;
  if (input.published === true) return BlogPostStatus.PUBLISHED;
  if (input.published === false) return BlogPostStatus.DRAFT;
  return BlogPostStatus.DRAFT;
}

async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  let query = getDb()
    .from(TABLES.BlogPost)
    .select("id")
    .eq("slug", slug)
    .is("deletedAt", null);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

async function syncTags(postId: string, tagIds?: string[]) {
  const db = getDb();
  await db.from(TABLES.BlogPostTag).delete().eq("postId", postId);
  if (tagIds?.length) {
    await db.from(TABLES.BlogPostTag).insert(tagIds.map((tagId) => ({ postId, tagId })));
  }
}

async function getNextVersionNumber(postId: string): Promise<number> {
  const { data } = await getDb()
    .from(TABLES.BlogPostVersion)
    .select("versionNumber")
    .eq("postId", postId)
    .order("versionNumber", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.versionNumber ?? 0) + 1;
}

async function createDraftVersion(params: {
  postId: string;
  snapshot: Record<string, unknown>;
  tagIds?: string[];
  createdById?: string | null;
  notes?: string | null;
}) {
  const versionNumber = await getNextVersionNumber(params.postId);
  await getDb()
    .from(TABLES.BlogPostVersion)
    .insert({
      id: newId(),
      postId: params.postId,
      versionNumber,
      title: String(params.snapshot.title),
      slug: String(params.snapshot.slug),
      excerpt: (params.snapshot.excerpt as string | null) ?? null,
      content: String(params.snapshot.content),
      coverImage: (params.snapshot.coverImage as string | null) ?? null,
      youtubeUrl: (params.snapshot.youtubeUrl as string | null) ?? null,
      seoTitle: (params.snapshot.seoTitle as string | null) ?? null,
      seoDescription: (params.snapshot.seoDescription as string | null) ?? null,
      categoryId: (params.snapshot.categoryId as string | null) ?? null,
      status: params.snapshot.status as BlogPostStatus,
      tagIds: params.tagIds ?? null,
      notes: params.notes ?? null,
      createdById: params.createdById ?? null,
      createdAt: new Date().toISOString(),
    });
}

function applyPostListFilters<
  T extends {
    is: (col: string, val: null) => T;
    eq: (col: string, val: string) => T;
    or: (filters: string) => T;
    order: (col: string, opts: { ascending: boolean; nullsFirst: boolean }) => T;
  },
>(query: T, params: BlogListQuery & { publicOnly?: boolean }): T {
  let q = query;

  if (!params.includeDeleted) {
    q = q.is("deletedAt", null);
  }

  if (params.publicOnly) {
    q = q.eq("status", BlogPostStatus.PUBLISHED);
  } else if (params.status) {
    q = q.eq("status", params.status);
  }

  if (params.categoryId) q = q.eq("categoryId", params.categoryId);
  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    q = q.or(`title.ilike.${pattern},excerpt.ilike.${pattern},content.ilike.${pattern}`);
  }

  const ascending = params.sortOrder === "asc";
  q = q.order(params.sortBy, { ascending, nullsFirst: false });

  return q;
}

export async function listBlogPosts(
  params: BlogListQuery & { publicOnly?: boolean },
): Promise<PaginatedResult<ReturnType<typeof mapBlogPostWithRelations>>> {
  const db = getDb();
  const { from, to } = parseListRange(params.page, params.pageSize);

  let categoryId = params.categoryId;
  if (params.categorySlug && !categoryId) {
    const { data: cat } = await db
      .from(TABLES.BlogCategory)
      .select("id")
      .eq("slug", params.categorySlug)
      .maybeSingle();
    categoryId = cat?.id ? String(cat.id) : "__none__";
  }

  const listParams = { ...params, categoryId };

  let query = db.from(TABLES.BlogPost).select(LIST_SELECT, { count: "exact" });
  query = applyPostListFilters(query, listParams);

  if (params.tagId) {
    const { data: tagLinks } = await db
      .from(TABLES.BlogPostTag)
      .select("postId")
      .eq("tagId", params.tagId);
    const postIds = (tagLinks ?? []).map((r) => String(r.postId));
    if (!postIds.length) {
      return buildPaginatedResult([], 0, params.page, params.pageSize);
    }
    query = query.in("id", postIds) as typeof query;
  }

  if (categoryId === "__none__") {
    return buildPaginatedResult([], 0, params.page, params.pageSize);
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items = (data ?? []).map((row) =>
    mapBlogPostWithRelations(row as Record<string, unknown>),
  );
  return buildPaginatedResult(items, count ?? 0, params.page, params.pageSize);
}

export async function getBlogPostById(id: string, options?: { includeDeleted?: boolean }) {
  let query = getDb().from(TABLES.BlogPost).select(POST_SELECT).eq("id", id);
  if (!options?.includeDeleted) query = query.is("deletedAt", null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBlogPostWithRelations(data as Record<string, unknown>);
}

export async function getBlogPostBySlugPublic(slug: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogPost)
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", BlogPostStatus.PUBLISHED)
    .is("deletedAt", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBlogPostWithRelations(data as Record<string, unknown>);
}

export async function createBlogPost(
  input: BlogPostInput,
  actorId?: string | null,
): Promise<{ id: string }> {
  const db = getDb();
  const now = new Date().toISOString();
  const status = resolveStatus(input);
  const slug =
    input.slug?.trim() ||
    (await generateUniqueSlug(input.title, (s) => isSlugTaken(s)));

  if (await isSlugTaken(slug)) {
    throw new Error("Este slug já está em uso");
  }

  const postId = newId();
  const readingTime = calculateReadingTime(input.content);
  const row = {
    id: postId,
    title: input.title.trim(),
    slug,
    excerpt: emptyToNull(input.excerpt ?? null),
    content: input.content,
    coverImage: emptyToNull(input.coverImage ?? null),
    youtubeUrl: emptyToNull(input.youtubeUrl ?? null),
    status,
    published: status === BlogPostStatus.PUBLISHED,
    publishedAt:
      status === BlogPostStatus.PUBLISHED
        ? input.publishedAt ?? now
        : input.publishedAt ?? null,
    seoTitle: emptyToNull(input.seoTitle ?? null),
    seoDescription: emptyToNull(input.seoDescription ?? null),
    readingTime,
    categoryId: input.categoryId ?? null,
    authorId: input.authorId ?? actorId ?? null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const { error } = await db.from(TABLES.BlogPost).insert(row);
  if (error) throw new Error(error.message);

  await syncTags(postId, input.tagIds);

  if (status === BlogPostStatus.DRAFT) {
    await createDraftVersion({
      postId,
      snapshot: row,
      tagIds: input.tagIds,
      createdById: actorId,
      notes: input.versionNotes ?? null,
    });
  }

  revalidateBlogPaths(slug);
  return { id: postId };
}

export async function updateBlogPost(
  id: string,
  input: BlogPostInput,
  actorId?: string | null,
): Promise<{ id: string }> {
  const existing = await getBlogPostById(id);
  if (!existing) throw new Error("Post não encontrado");

  const status = input.status ?? existing.status;
  const slug =
    input.slug?.trim() ||
    existing.slug ||
    (await generateUniqueSlug(input.title, (s) => isSlugTaken(s, id)));

  if (slug !== existing.slug && (await isSlugTaken(slug, id))) {
    throw new Error("Este slug já está em uso");
  }

  const now = new Date().toISOString();
  const readingTime = calculateReadingTime(input.content);
  const row = {
    title: input.title.trim(),
    slug,
    excerpt: emptyToNull(input.excerpt ?? null),
    content: input.content,
    coverImage: emptyToNull(input.coverImage ?? null),
    youtubeUrl: emptyToNull(input.youtubeUrl ?? null),
    status,
    published: status === BlogPostStatus.PUBLISHED,
    publishedAt:
      status === BlogPostStatus.PUBLISHED
        ? input.publishedAt ?? existing.publishedAt?.toISOString() ?? now
        : input.publishedAt ?? null,
    seoTitle: emptyToNull(input.seoTitle ?? null),
    seoDescription: emptyToNull(input.seoDescription ?? null),
    readingTime,
    categoryId: input.categoryId ?? null,
    authorId: input.authorId ?? existing.authorId,
    updatedAt: now,
  };

  const { error } = await getDb().from(TABLES.BlogPost).update(row).eq("id", id);
  if (error) throw new Error(error.message);

  if (input.tagIds) await syncTags(id, input.tagIds);

  if (status === BlogPostStatus.DRAFT) {
    await createDraftVersion({
      postId: id,
      snapshot: { ...row, status },
      tagIds: input.tagIds,
      createdById: actorId,
      notes: input.versionNotes ?? null,
    });
  }

  revalidateBlogPaths(slug, existing.slug);
  return { id };
}

export async function publishBlogPost(id: string): Promise<{ id: string }> {
  const post = await getBlogPostById(id);
  if (!post) throw new Error("Post não encontrado");

  const now = new Date().toISOString();
  const { error } = await getDb()
    .from(TABLES.BlogPost)
    .update({
      status: BlogPostStatus.PUBLISHED,
      published: true,
      publishedAt: post.publishedAt?.toISOString() ?? now,
      updatedAt: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths(post.slug);
  return { id };
}

export async function unpublishBlogPost(id: string): Promise<{ id: string }> {
  const post = await getBlogPostById(id);
  if (!post) throw new Error("Post não encontrado");

  const now = new Date().toISOString();
  const { error } = await getDb()
    .from(TABLES.BlogPost)
    .update({
      status: BlogPostStatus.DRAFT,
      published: false,
      updatedAt: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths(post.slug);
  return { id };
}

export async function duplicateBlogPost(id: string, actorId?: string | null): Promise<{ id: string }> {
  const post = await getBlogPostById(id);
  if (!post) throw new Error("Post não encontrado");

  const baseSlug = `${post.slug}-copia`;
  const slug = await generateUniqueSlug(baseSlug, isSlugTaken);
  const tagIds = post.tags?.map((t) => t.tagId) ?? [];

  return createBlogPost(
    {
      title: `${post.title} (cópia)`,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      youtubeUrl: post.youtubeUrl,
      status: BlogPostStatus.DRAFT,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      categoryId: post.categoryId,
      authorId: post.authorId ?? actorId ?? null,
      tagIds,
      versionNotes: "Duplicado de outro post",
    },
    actorId,
  );
}

export async function softDeleteBlogPost(id: string): Promise<void> {
  const post = await getBlogPostById(id);
  if (!post) throw new Error("Post não encontrado");

  const now = new Date().toISOString();
  const { error } = await getDb()
    .from(TABLES.BlogPost)
    .update({ deletedAt: now, updatedAt: now })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths(post.slug);
}

export async function incrementBlogPostViews(id: string): Promise<void> {
  const post = await getBlogPostById(id);
  if (!post || post.status !== BlogPostStatus.PUBLISHED) return;

  await getDb()
    .from(TABLES.BlogPost)
    .update({ views: (post.views ?? 0) + 1 })
    .eq("id", id);
}

export function revalidateBlogPaths(...slugs: string[]) {
  revalidateTag(BLOG_CACHE_TAG);
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs) {
    if (slug) revalidatePath(`/blog/${slug}`);
  }
}

export const getCachedPublishedPosts = unstable_cache(
  async (page: number, pageSize: number) => {
    return listBlogPosts({
      page,
      pageSize,
      sortBy: "publishedAt",
      sortOrder: "desc",
      publicOnly: true,
      includeDeleted: false,
    });
  },
  ["blog-published-posts"],
  { revalidate: 300, tags: [BLOG_CACHE_TAG] },
);

export const getCachedPostBySlug = unstable_cache(
  async (slug: string) => getBlogPostBySlugPublic(slug),
  ["blog-post-by-slug"],
  { revalidate: 300, tags: [BLOG_CACHE_TAG] },
);

export { BLOG_PUBLISHED_POST_FILTER, slugify };
