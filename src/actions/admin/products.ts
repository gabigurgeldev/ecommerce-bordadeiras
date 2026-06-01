"use server";

import { prisma } from "@/lib/prisma";
import { productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";
import { auditMutation, revalidateAdmin, withAdmin, type ActionResult } from "./_utils";

export async function listProducts() {
  return prisma.product.findMany({
    include: { category: true, productImages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, productImages: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function upsertProduct(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const payload = {
      ...parsed.data,
      slug: parsed.data.slug || slugify(parsed.data.name),
      compareCents: parsed.data.compareCents ?? null,
      categoryId: parsed.data.categoryId || null,
    };

    const product = id
      ? await prisma.product.update({ where: { id }, data: payload })
      : await prisma.product.create({ data: payload });

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Product",
      entityId: product.id,
    });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true, data: { id: product.id } };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    await prisma.product.delete({ where: { id } });
    await auditMutation(actor, { action: "DELETE", entity: "Product", entityId: id });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true };
  });
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const source = await prisma.product.findUnique({ where: { id } });
    if (!source) return { success: false, error: "Produto não encontrado" };

    const images = await prisma.productImage.findMany({
      where: { productId: source.id },
      orderBy: { sortOrder: "asc" },
    });

    const copy = await prisma.product.create({
      data: {
        name: `${source.name} (cópia)`,
        slug: `${source.slug}-copia-${Date.now()}`,
        description: source.description,
        sku: source.sku ? `${source.sku}-COPY` : null,
        priceCents: source.priceCents,
        compareCents: source.compareCents,
        stock: source.stock,
        active: false,
        status: source.status,
        images: source.images ?? undefined,
        categoryId: source.categoryId,
        productImages: {
          create: images.map((img) => ({
            url: img.url,
            alt: img.alt,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        },
      },
    });
    await auditMutation(actor, { action: "CREATE", entity: "Product", entityId: copy.id, metadata: { duplicatedFrom: id } });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true, data: { id: copy.id } };
  });
}

/** CSV import/export stubs — wire to file upload in a later iteration. */
export async function exportProductsCsvStub(): Promise<ActionResult<{ message: string }>> {
  return withAdmin(async (actor) => {
    await auditMutation(actor, { action: "EXPORT", entity: "Product" });
    return { success: true, data: { message: "Export CSV: implementar upload/download" } };
  });
}

export async function importProductsCsvStub(): Promise<ActionResult<{ message: string }>> {
  return withAdmin(async (actor) => {
    await auditMutation(actor, { action: "IMPORT", entity: "Product" });
    return { success: true, data: { message: "Import CSV: implementar parser" } };
  });
}
