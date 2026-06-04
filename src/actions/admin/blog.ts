"use server";

import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { blogCategorySchema, blogPostSchema, blogTagSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listBlogPosts() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.BlogPost)
      .select("*, BlogCategory(*), BlogPostTag(*, BlogTag(*))")
      .order("updatedAt", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function listBlogCategories() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.BlogCategory)
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function listBlogTags() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.BlogTag)
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });
}

export async function getBlogPost(id: string) {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.BlogPost)
      .select("*, BlogCategory(*), BlogPostTag(*, BlogTag(*))")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
}

export async function upsertBlogPost(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogPostSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const db = getDb();
    const now = new Date().toISOString();
    const { tagIds, ...rest } = parsed.data;
    const postData = {
      title: rest.title,
      slug: rest.slug,
      excerpt: rest.excerpt ?? null,
      content: rest.content,
      coverImage: rest.coverImage || null,
      published: rest.published,
      publishedAt: rest.published ? now : null,
      seoTitle: rest.seoTitle ?? null,
      seoDescription: rest.seoDescription ?? null,
      categoryId: rest.categoryId || null,
      updatedAt: now,
    };

    let postId = id;
    if (id) {
      const { error } = await db.from(TABLES.BlogPost).update(postData).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      postId = newId();
      const { error } = await db.from(TABLES.BlogPost).insert({
        id: postId,
        ...postData,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    if (tagIds) {
      await db.from(TABLES.BlogPostTag).delete().eq("postId", postId!);
      if (tagIds.length) {
        await db.from(TABLES.BlogPostTag).insert(
          tagIds.map((tagId) => ({ postId: postId!, tagId })),
        );
      }
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "BlogPost",
      entityId: postId!,
    });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: postId! } };
  });
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const db = getDb();
    await db.from(TABLES.BlogPostTag).delete().eq("postId", id);
    const { error } = await db.from(TABLES.BlogPost).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, { action: "DELETE", entity: "BlogPost", entityId: id });
    revalidateAdmin(["/admin/blog"]);
    return { success: true };
  });
}

export async function upsertBlogCategory(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogCategorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    const db = getDb();
    const now = new Date().toISOString();
    let rowId = id;
    if (id) {
      const { error } = await db
        .from(TABLES.BlogCategory)
        .update({ ...parsed.data, updatedAt: now })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      rowId = newId();
      const { error } = await db.from(TABLES.BlogCategory).insert({
        id: rowId,
        ...parsed.data,
        createdAt: now,
        updatedAt: now,
      });
      if (error) return { success: false, error: error.message };
    }
    await auditMutation(actor, { action: id ? "UPDATE" : "CREATE", entity: "BlogCategory", entityId: rowId! });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: rowId! } };
  });
}

export async function upsertBlogTag(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogTagSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    const db = getDb();
    const now = new Date().toISOString();
    let rowId = id;
    if (id) {
      const { error } = await db.from(TABLES.BlogTag).update(parsed.data).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      rowId = newId();
      const { error } = await db.from(TABLES.BlogTag).insert({
        id: rowId,
        ...parsed.data,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }
    await auditMutation(actor, { action: id ? "UPDATE" : "CREATE", entity: "BlogTag", entityId: rowId! });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: rowId! } };
  });
}
