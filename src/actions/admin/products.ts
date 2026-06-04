"use server";

import { z } from "zod";
import { ProductStatus } from "@/lib/types/database";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import { productImageInputSchema, productSchema } from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

const PRODUCT_SELECT = "*, Category(*), ProductImage(*)";

export async function listProducts() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
      .order("updatedAt", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });
}

export async function getProduct(id: string) {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  });
}

export async function upsertProduct(
  data: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.flatten().formErrors.join(", ") };

    const db = getDb();
    const now = new Date().toISOString();
    const payload = {
      ...parsed.data,
      slug: parsed.data.slug || slugify(parsed.data.name),
      compareCents: parsed.data.compareCents ?? null,
      categoryId: parsed.data.categoryId || null,
      active: parsed.data.status === ProductStatus.ACTIVE,
      updatedAt: now,
    };

    let productId = id;
    if (id) {
      const { error } = await db.from(TABLES.Product).update(payload).eq("id", id);
      if (error) return { success: false, error: error.message };
    } else {
      productId = newId();
      const { error } = await db.from(TABLES.Product).insert({
        id: productId,
        ...payload,
        createdAt: now,
      });
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: id ? "UPDATE" : "CREATE",
      entity: "Product",
      entityId: productId!,
    });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true, data: { id: productId! } };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const { error } = await getDb().from(TABLES.Product).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    await auditMutation(actor, { action: "DELETE", entity: "Product", entityId: id });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true };
  });
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  return withAdmin(async (actor) => {
    const db = getDb();
    const { data: source, error } = await db
      .from(TABLES.Product)
      .select(PRODUCT_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error || !source) return { success: false, error: "Produto não encontrado" };

    const images = (source.ProductImage as Record<string, unknown>[]) ?? [];
    const copyId = newId();
    const now = new Date().toISOString();

    const { error: createErr } = await db.from(TABLES.Product).insert({
      id: copyId,
      name: `${source.name} (cópia)`,
      slug: `${source.slug}-copia-${Date.now()}`,
      description: source.description,
      sku: source.sku ? `${source.sku}-COPY` : null,
      priceCents: source.priceCents,
      compareCents: source.compareCents,
      stock: source.stock,
      active: false,
      status: ProductStatus.DRAFT,
      images: source.images,
      categoryId: source.categoryId,
      createdAt: now,
      updatedAt: now,
    });
    if (createErr) return { success: false, error: createErr.message };

    if (images.length) {
      await db.from(TABLES.ProductImage).insert(
        images.map((img) => ({
          id: newId(),
          productId: copyId,
          url: img.url,
          alt: img.alt,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          createdAt: now,
        })),
      );
    }

    await auditMutation(actor, {
      action: "CREATE",
      entity: "Product",
      entityId: copyId,
      metadata: { duplicatedFrom: id },
    });
    revalidateAdmin(["/admin/produtos"]);
    return { success: true, data: { id: copyId } };
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

    const db = getDb();
    await db.from(TABLES.ProductImage).delete().eq("productId", productId);
    if (parsed.data.length > 0) {
      const now = new Date().toISOString();
      const { error } = await db.from(TABLES.ProductImage).insert(
        parsed.data.map((img) => ({
          id: newId(),
          productId,
          url: img.url,
          alt: img.alt ?? null,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
          createdAt: now,
        })),
      );
      if (error) return { success: false, error: error.message };
    }

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
    const { data: products, error } = await getDb()
      .from(TABLES.Product)
      .select("*, Category(slug)")
      .order("name", { ascending: true });
    if (error) return { success: false, error: error.message };

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
    const rows = (products ?? []).map((p) => {
      const cat = p.Category as { slug?: string } | null;
      return [
        p.id,
        p.name,
        p.slug,
        p.sku ?? "",
        String(p.priceCents),
        p.compareCents != null ? String(p.compareCents) : "",
        String(p.stock),
        p.status,
        String(p.active),
        cat?.slug ?? "",
      ]
        .map((v) => escapeCsvField(String(v)))
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const filename = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;

    await auditMutation(actor, {
      action: "EXPORT",
      entity: "Product",
      metadata: { count: products?.length ?? 0 },
    });
    return { success: true, data: { csv, filename } };
  });
}
