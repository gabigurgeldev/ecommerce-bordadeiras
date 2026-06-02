"use server";

import { prisma } from "@/lib/prisma";
import { blogCategorySchema, blogPostSchema, blogTagSchema } from "@/lib/validations/admin";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listBlogPosts() {
  return withAdminRead(() =>
    prisma.blogPost.findMany({
      include: { category: true, tags: { include: { tag: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  );
}

export async function listBlogCategories() {
  return withAdminRead(() => prisma.blogCategory.findMany({ orderBy: { name: "asc" } }));
}

export async function listBlogTags() {
  return withAdminRead(() => prisma.blogTag.findMany({ orderBy: { name: "asc" } }));
}

export async function getBlogPost(id: string) {
  return withAdminRead(() =>
    prisma.blogPost.findUnique({
      where: { id },
      include: { category: true, tags: { include: { tag: true } } },
    }),
  );
}

export async function upsertBlogPost(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogPostSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const { tagIds, ...rest } = parsed.data;
    const postData = {
      title: rest.title,
      slug: rest.slug,
      excerpt: rest.excerpt ?? null,
      content: rest.content,
      coverImage: rest.coverImage || null,
      published: rest.published,
      publishedAt: rest.published ? new Date() : null,
      seoTitle: rest.seoTitle ?? null,
      seoDescription: rest.seoDescription ?? null,
      categoryId: rest.categoryId || null,
    };

    const post = id
      ? await prisma.blogPost.update({ where: { id }, data: postData })
      : await prisma.blogPost.create({ data: postData });

    if (tagIds) {
      await prisma.blogPostTag.deleteMany({ where: { postId: post.id } });
      if (tagIds.length) {
        await prisma.blogPostTag.createMany({
          data: tagIds.map((tagId) => ({ postId: post.id, tagId })),
        });
      }
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "BlogPost",
      entityId: post.id,
    });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: post.id } };
  });
}

export async function deleteBlogPost(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.blogPost.delete({ where: { id } });
    await auditMutation(actor, { action: "DELETE", entity: "BlogPost", entityId: id });
    revalidateAdmin(["/admin/blog"]);
    return { success: true };
  });
}

export async function upsertBlogCategory(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogCategorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    const row = id
      ? await prisma.blogCategory.update({ where: { id }, data: parsed.data })
      : await prisma.blogCategory.create({ data: parsed.data });
    await auditMutation(actor, { action: id ? "UPDATE" : "CREATE", entity: "BlogCategory", entityId: row.id });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: row.id } };
  });
}

export async function upsertBlogTag(data: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = blogTagSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: "Dados inválidos" };
    const row = id
      ? await prisma.blogTag.update({ where: { id }, data: parsed.data })
      : await prisma.blogTag.create({ data: parsed.data });
    await auditMutation(actor, { action: id ? "UPDATE" : "CREATE", entity: "BlogTag", entityId: row.id });
    revalidateAdmin(["/admin/blog"]);
    return { success: true, data: { id: row.id } };
  });
}
