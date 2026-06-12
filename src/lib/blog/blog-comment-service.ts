import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { mapBlogCommentRow } from "@/lib/blog/mappers";
import type { BlogCommentPublic, PaginatedResult } from "@/lib/blog/types";
import { buildPaginatedResult, parseListRange } from "@/lib/blog/utils";
import { BlogPostStatus } from "@/lib/types/database";
import type { BlogCommentInput } from "@/lib/validations/blog";
import { getBlogPostById } from "@/lib/blog/blog-post-service";

export async function listBlogComments(params: {
  page?: number;
  pageSize?: number;
  postId?: string;
  isApproved?: "true" | "false" | "all";
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedResult<ReturnType<typeof mapBlogCommentRow>>> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const { from, to } = parseListRange(page, pageSize);

  let query = getDb()
    .from(TABLES.BlogComment)
    .select("*", { count: "exact" });

  if (params.postId) query = query.eq("postId", params.postId);
  if (params.isApproved === "true") query = query.eq("isApproved", true);
  if (params.isApproved === "false") query = query.eq("isApproved", false);

  const ascending = (params.sortOrder ?? "desc") === "asc";
  query = query.order("createdAt", { ascending });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const items = (data ?? []).map((row) => mapBlogCommentRow(row as Record<string, unknown>));
  return buildPaginatedResult(items, count ?? 0, page, pageSize);
}

export async function listApprovedCommentsForPost(postId: string): Promise<BlogCommentPublic[]> {
  const { data, error } = await getDb()
    .from(TABLES.BlogComment)
    .select("id, postId, authorName, content, parentId, createdAt")
    .eq("postId", postId)
    .eq("isApproved", true)
    .order("createdAt", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    createdAt: new Date(String(row.createdAt)),
  })) as BlogCommentPublic[];
}

export async function submitBlogComment(input: BlogCommentInput) {
  const post = await getBlogPostById(input.postId);
  if (!post || post.status !== BlogPostStatus.PUBLISHED) {
    throw new Error("Post não encontrado ou não publicado");
  }

  if (input.parentId) {
    const { data: parent } = await getDb()
      .from(TABLES.BlogComment)
      .select("id")
      .eq("id", input.parentId)
      .eq("postId", input.postId)
      .maybeSingle();
    if (!parent) throw new Error("Comentário pai inválido");
  }

  const id = newId();
  const now = new Date().toISOString();
  const { error } = await getDb().from(TABLES.BlogComment).insert({
    id,
    postId: input.postId,
    authorName: input.authorName.trim(),
    authorEmail: input.authorEmail.trim().toLowerCase(),
    content: input.content.trim(),
    isApproved: false,
    parentId: input.parentId ?? null,
    createdAt: now,
  });
  if (error) throw new Error(error.message);

  return { id };
}

export async function approveBlogComment(id: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogComment)
    .update({ isApproved: true })
    .eq("id", id)
    .select("id, postId")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Comentário não encontrado");
  return { id: String(data.id), postId: String(data.postId) };
}

export async function rejectBlogComment(id: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogComment)
    .update({ isApproved: false })
    .eq("id", id)
    .select("id, postId")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Comentário não encontrado");
  return { id: String(data.id), postId: String(data.postId) };
}

export async function deleteBlogComment(id: string) {
  const { data, error } = await getDb()
    .from(TABLES.BlogComment)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Comentário não encontrado");
}

export async function countPendingComments(): Promise<number> {
  const { count, error } = await getDb()
    .from(TABLES.BlogComment)
    .select("id", { count: "exact", head: true })
    .eq("isApproved", false);
  if (error) throw error;
  return count ?? 0;
}
