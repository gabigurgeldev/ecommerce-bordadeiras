import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { mapBlogCategoryRow } from "@/lib/blog/mappers";
import type { PaginatedResult } from "@/lib/blog/types";
import {
  buildPaginatedResult,
  emptyToNull,
  generateUniqueSlug,
  parseListRange,
} from "@/lib/blog/utils";
import type { BlogCategoryInput } from "@/lib/validations/blog";
import { slugify } from "@/lib/utils";
import { revalidateBlogPaths, BLOG_CACHE_TAG } from "@/lib/blog/blog-post-service";
import { unstable_cache } from "next/cache";

async function isCategorySlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  let query = getDb().from(TABLES.BlogCategory).select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();
  return Boolean(data);
}

export async function listBlogCategories(params?: {
  page?: number;
  pageSize?: number;
  activeOnly?: boolean;
  search?: string;
  sortBy?: "name" | "sortOrder" | "postsCount" | "createdAt";
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedResult<ReturnType<typeof mapBlogCategoryRow>>> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 50;
  const { from, to } = parseListRange(page, pageSize);

  let query = getDb()
    .from(TABLES.BlogCategory)
    .select("*", { count: "exact" });

  if (params?.activeOnly) query = query.eq("isActive", true);
  if (params?.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
  }

  const sortBy = params?.sortBy ?? "sortOrder";
  const ascending = (params?.sortOrder ?? "asc") === "asc";
  query = query.order(sortBy, { ascending });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items = (data ?? []).map((row) => mapBlogCategoryRow(row as Record<string, unknown>));
  return buildPaginatedResult(items, count ?? 0, page, pageSize);
}

export async function getBlogCategoryById(id: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogCategory)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBlogCategoryRow(data as Record<string, unknown>);
}

export async function getBlogCategoryBySlug(slug: string, activeOnly = false) {
  let query = getDb().from(TABLES.BlogCategory).select("*").eq("slug", slug);
  if (activeOnly) query = query.eq("isActive", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapBlogCategoryRow(data as Record<string, unknown>);
}

export async function createBlogCategory(input: BlogCategoryInput) {
  const slug =
    input.slug?.trim() ||
    (await generateUniqueSlug(input.name, (s) => isCategorySlugTaken(s)));

  if (await isCategorySlugTaken(slug)) {
    throw new Error("Este slug já está em uso");
  }

  const now = new Date().toISOString();
  const id = newId();
  const row = {
    id,
    name: input.name.trim(),
    slug,
    description: emptyToNull(input.description ?? null),
    icon: emptyToNull(input.icon ?? null),
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
    postsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const { error } = await getDb().from(TABLES.BlogCategory).insert(row);
  if (error) throw new Error(error.message);

  revalidateBlogPaths();
  return { id };
}

export async function updateBlogCategory(id: string, input: BlogCategoryInput) {
  const existing = await getBlogCategoryById(id);
  if (!existing) throw new Error("Categoria não encontrada");

  const slug =
    input.slug?.trim() ||
    existing.slug ||
    slugify(input.name);

  if (slug !== existing.slug && (await isCategorySlugTaken(slug, id))) {
    throw new Error("Este slug já está em uso");
  }

  const now = new Date().toISOString();
  const { error } = await getDb()
    .from(TABLES.BlogCategory)
    .update({
      name: input.name.trim(),
      slug,
      description: emptyToNull(input.description ?? null),
      icon: emptyToNull(input.icon ?? null),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: now,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths();
  return { id };
}

export async function deleteBlogCategory(id: string) {
  const existing = await getBlogCategoryById(id);
  if (!existing) throw new Error("Categoria não encontrada");

  if (existing.postsCount > 0) {
    throw new Error("Não é possível excluir categoria com posts publicados");
  }

  const { count } = await getDb()
    .from(TABLES.BlogPost)
    .select("id", { count: "exact", head: true })
    .eq("categoryId", id)
    .is("deletedAt", null);

  if ((count ?? 0) > 0) {
    throw new Error("Não é possível excluir categoria com posts associados");
  }

  const { error } = await getDb().from(TABLES.BlogCategory).delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths();
}

export async function reorderBlogCategories(
  items: Array<{ id: string; sortOrder: number }>,
) {
  const db = getDb();
  const now = new Date().toISOString();

  for (const item of items) {
    const { error } = await db
      .from(TABLES.BlogCategory)
      .update({ sortOrder: item.sortOrder, updatedAt: now })
      .eq("id", item.id);
    if (error) throw new Error(error.message);
  }

  revalidateBlogPaths();
}

export async function toggleBlogCategoryActive(id: string) {
  const existing = await getBlogCategoryById(id);
  if (!existing) throw new Error("Categoria não encontrada");

  const now = new Date().toISOString();
  const { error } = await getDb()
    .from(TABLES.BlogCategory)
    .update({ isActive: !existing.isActive, updatedAt: now })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateBlogPaths();
  return { id, isActive: !existing.isActive };
}

export const getCachedActiveBlogCategories = unstable_cache(
  async () =>
    listBlogCategories({
      page: 1,
      pageSize: 100,
      activeOnly: true,
      sortBy: "sortOrder",
      sortOrder: "asc",
    }),
  ["blog-active-categories"],
  { revalidate: 300, tags: [BLOG_CACHE_TAG] },
);
