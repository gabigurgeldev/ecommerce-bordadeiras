"use server";

import { revalidatePath } from "next/cache";
import {
  createBlogPost,
  updateBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  duplicateBlogPost,
  softDeleteBlogPost,
  getBlogPostById,
  listBlogPosts,
  getCachedPublishedPosts,
  getCachedPostBySlug,
  incrementBlogPostViews,
} from "@/lib/blog/blog-post-service";
import {
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
  reorderBlogCategories,
  toggleBlogCategoryActive,
  listBlogCategories,
  getBlogCategoryById,
} from "@/lib/blog/blog-category-service";
import {
  listBlogComments,
  approveBlogComment,
  rejectBlogComment,
  deleteBlogComment,
} from "@/lib/blog/blog-comment-service";
import {
  uploadBlogImage,
  addYouTubeMedia,
  createBlogMedia,
  deleteBlogMedia,
  listBlogMedia,
} from "@/lib/blog/blog-media-service";
import { enhanceBlogText } from "@/lib/blog/ai-text-enhancer-service";
import { getBlogStats } from "@/lib/blog/blog-stats-service";
import { searchBlog } from "@/lib/blog/blog-search-service";
import { buildBlogMetaTags, autoGenerateSeoFields } from "@/lib/blog/blog-seo-service";
import {
  blogPostInputSchema,
  blogCategoryInputSchema,
  blogCategoryReorderSchema,
  blogCommentListQuerySchema,
  blogMediaInputSchema,
  blogAiEnhanceSchema,
  blogListQuerySchema,
  blogSearchQuerySchema,
} from "@/lib/validations/blog";
import { OpenRouterError } from "@/lib/openrouter/client";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

function serializeDates<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = serializeDates(v as Record<string, unknown>);
    } else if (Array.isArray(v)) {
      out[k] = v.map((item) =>
        item && typeof item === "object" ? serializeDates(item as Record<string, unknown>) : item,
      );
    }
  }
  return out as T;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function adminListBlogPosts(query?: unknown) {
  return withAdminRead(async () => {
    const parsed = blogListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) throw new Error("Parâmetros inválidos");
    const result = await listBlogPosts(parsed.data);
    return serializeDates(result as unknown as Record<string, unknown>);
  });
}

export async function adminGetBlogPost(id: string) {
  return withAdminRead(async () => {
    const post = await getBlogPostById(id);
    if (!post) throw new Error("Post não encontrado");
    return serializeDates(post as unknown as Record<string, unknown>);
  });
}

export async function adminCreateBlogPost(data: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogPostInputSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors.join(", ") || "Dados inválidos" };
    }
    try {
      const result = await createBlogPost(parsed.data, actor.id);
      await auditMutation(actor, { action: "CREATE", entity: "BlogPost", entityId: result.id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao criar post" };
    }
  });
}

export async function adminUpdateBlogPost(
  id: string,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogPostInputSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors.join(", ") || "Dados inválidos" };
    }
    try {
      const result = await updateBlogPost(id, parsed.data, actor.id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogPost", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar post" };
    }
  });
}

export async function adminPublishBlogPost(id: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    try {
      const result = await publishBlogPost(id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogPost", entityId: id, metadata: { action: "publish" } });
      revalidateAdmin(["/admin/blog"]);
      revalidatePath("/blog");
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao publicar" };
    }
  });
}

export async function adminUnpublishBlogPost(id: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    try {
      const result = await unpublishBlogPost(id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogPost", entityId: id, metadata: { action: "unpublish" } });
      revalidateAdmin(["/admin/blog"]);
      revalidatePath("/blog");
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao despublicar" };
    }
  });
}

export async function adminDuplicateBlogPost(id: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    try {
      const result = await duplicateBlogPost(id, actor.id);
      await auditMutation(actor, { action: "CREATE", entity: "BlogPost", entityId: result.id, metadata: { duplicatedFrom: id } });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao duplicar post" };
    }
  });
}

export async function adminSoftDeleteBlogPost(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await softDeleteBlogPost(id);
      await auditMutation(actor, { action: "DELETE", entity: "BlogPost", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      revalidatePath("/blog");
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao excluir post" };
    }
  });
}

export async function adminGenerateBlogSeo(data: {
  title: string;
  excerpt?: string | null;
  content: string;
}) {
  return withAdminRead(async () => autoGenerateSeoFields(data));
}

export async function adminGetBlogPostMeta(id: string) {
  return withAdminRead(async () => {
    const post = await getBlogPostById(id);
    if (!post) throw new Error("Post não encontrado");
    return buildBlogMetaTags(post);
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function adminListBlogCategories(query?: unknown) {
  return withAdminRead(async () => {
    const params =
      query && typeof query === "object"
        ? (query as Record<string, unknown>)
        : {};
    const result = await listBlogCategories({
      page: Number(params.page ?? 1),
      pageSize: Number(params.pageSize ?? 50),
      search: params.search ? String(params.search) : undefined,
    });
    return serializeDates(result as unknown as Record<string, unknown>);
  });
}

export async function adminCreateBlogCategory(data: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogCategoryInputSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    try {
      const result = await createBlogCategory(parsed.data);
      await auditMutation(actor, { action: "CREATE", entity: "BlogCategory", entityId: result.id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao criar categoria" };
    }
  });
}

export async function adminUpdateBlogCategory(
  id: string,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogCategoryInputSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    try {
      const result = await updateBlogCategory(id, parsed.data);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogCategory", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao atualizar categoria" };
    }
  });
}

export async function adminDeleteBlogCategory(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await deleteBlogCategory(id);
      await auditMutation(actor, { action: "DELETE", entity: "BlogCategory", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao excluir categoria" };
    }
  });
}

export async function adminReorderBlogCategories(data: unknown): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = blogCategoryReorderSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    try {
      await reorderBlogCategories(parsed.data.items);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogCategory", metadata: { reordered: true } });
      revalidateAdmin(["/admin/blog"]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao reordenar categorias" };
    }
  });
}

export async function adminToggleBlogCategoryActive(
  id: string,
): Promise<ActionResult<{ id: string; isActive: boolean }>> {
  return withAdmin(async (actor) => {
    try {
      const result = await toggleBlogCategoryActive(id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogCategory", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao alterar status" };
    }
  });
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function adminListBlogComments(query?: unknown) {
  return withAdminRead(async () => {
    const parsed = blogCommentListQuerySchema.safeParse(query ?? {});
    if (!parsed.success) throw new Error("Parâmetros inválidos");
    const result = await listBlogComments(parsed.data);
    return serializeDates(result as unknown as Record<string, unknown>);
  });
}

export async function adminApproveBlogComment(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await approveBlogComment(id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogComment", entityId: id });
      revalidatePath("/blog");
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao aprovar comentário" };
    }
  });
}

export async function adminRejectBlogComment(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await rejectBlogComment(id);
      await auditMutation(actor, { action: "UPDATE", entity: "BlogComment", entityId: id });
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao rejeitar comentário" };
    }
  });
}

export async function adminDeleteBlogComment(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await deleteBlogComment(id);
      await auditMutation(actor, { action: "DELETE", entity: "BlogComment", entityId: id });
      revalidatePath("/blog");
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao excluir comentário" };
    }
  });
}

// ─── Media ───────────────────────────────────────────────────────────────────

export async function adminListBlogMedia(postId: string) {
  return withAdminRead(async () => {
    const items = await listBlogMedia(postId);
    return serializeDates({ items } as unknown as Record<string, unknown>);
  });
}

export async function adminCreateBlogMedia(data: unknown): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogMediaInputSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    try {
      const result = await createBlogMedia(parsed.data);
      await auditMutation(actor, { action: "CREATE", entity: "BlogMedia", entityId: result.id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao adicionar mídia" };
    }
  });
}

export async function adminDeleteBlogMedia(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    try {
      await deleteBlogMedia(id);
      await auditMutation(actor, { action: "DELETE", entity: "BlogMedia", entityId: id });
      revalidateAdmin(["/admin/blog"]);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Erro ao excluir mídia" };
    }
  });
}

export async function adminAddYouTubeMedia(
  postId: string,
  url: string,
): Promise<ActionResult<Record<string, unknown>>> {
  return withAdmin(async (actor) => {
    try {
      const result = await addYouTubeMedia(postId, url);
      await auditMutation(actor, { action: "CREATE", entity: "BlogMedia", entityId: result.mediaId });
      revalidateAdmin(["/admin/blog"]);
      return { success: true, data: result as unknown as Record<string, unknown> };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "URL do YouTube inválida" };
    }
  });
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export async function adminEnhanceBlogText(
  data: unknown,
): Promise<ActionResult<Record<string, string>>> {
  return withAdmin(async (actor) => {
    const parsed = blogAiEnhanceSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    try {
      const result = await enhanceBlogText(parsed.data);
      await auditMutation(actor, {
        action: "UPDATE",
        entity: "BlogPost",
        metadata: { aiScope: parsed.data.scope },
      });
      return { success: true, data: result };
    } catch (e) {
      if (e instanceof OpenRouterError) return { success: false, error: e.message };
      return { success: false, error: "Falha ao comunicar com a IA" };
    }
  });
}

// ─── Stats & search ──────────────────────────────────────────────────────────

export async function adminGetBlogStats() {
  return withAdminRead(() => getBlogStats());
}

export async function adminSearchBlog(query?: unknown) {
  return withAdminRead(async () => {
    const parsed = blogSearchQuerySchema.safeParse(query ?? {});
    if (!parsed.success) throw new Error("Parâmetros inválidos");
    const result = await searchBlog(parsed.data);
    return serializeDates(result as unknown as Record<string, unknown>);
  });
}

// Re-export for public cached reads (admin preview)
export { getCachedPublishedPosts, getCachedPostBySlug, getBlogCategoryById, incrementBlogPostViews };
