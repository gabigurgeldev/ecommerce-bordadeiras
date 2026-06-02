"use server";

import { z } from "zod";
import { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { productImageInputSchema, productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

export async function listProducts() {
  return withAdminRead(() =>
    prisma.product.findMany({
      include: { category: true, productImages: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
  );
}

export async function getProduct(id: string) {
  return withAdminRead(() =>
    prisma.product.findUnique({
      where: { id },
      include: { category: true, productImages: { orderBy: { sortOrder: "asc" } } },
    }),
  );
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
      active: parsed.data.status === ProductStatus.ACTIVE,
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
        status: ProductStatus.DRAFT,
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

export async function syncProductImages(
  productId: string,
  images: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = z.array(productImageInputSchema).safeParse(images);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors.join(", ") };
    }

    await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId } });
      if (parsed.data.length > 0) {
        await tx.productImage.createMany({
          data: parsed.data.map((img) => ({
            productId,
            url: img.url,
            alt: img.alt ?? null,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
          })),
        });
      }
    });

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "Product",
      entityId: productId,
      metadata: { images: parsed.data.length },
    });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true };
  });
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportProductsCsv(): Promise<
  ActionResult<{ csv: string; filename: string }>
> {
  return withAdmin(async (actor) => {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });

    const headers = [
      "id",
      "name",
      "slug",
      "sku",
      "priceCents",
      "compareCents",
      "stock",
      "status",
      "active",
      "categorySlug",
    ];
    const rows = products.map((p) =>
      [
        p.id,
        p.name,
        p.slug,
        p.sku ?? "",
        String(p.priceCents),
        p.compareCents != null ? String(p.compareCents) : "",
        String(p.stock),
        p.status,
        String(p.active),
        p.category?.slug ?? "",
      ]
        .map(escapeCsvField)
        .join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;

    await auditMutation(actor, { action: "EXPORT", entity: "Product", metadata: { count: products.length } });
    return { success: true, data: { csv, filename } };
  });
}
