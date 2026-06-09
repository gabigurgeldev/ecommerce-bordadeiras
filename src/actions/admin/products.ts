"use server";

import { z } from "zod";
import { ProductStatus, ShippingMode } from "@/lib/types/database";
import { parseProductRow } from "@/lib/data/mappers";
import {
  isProductDetailSelectError,
  PRODUCT_DETAIL_SELECT,
  PRODUCT_LIST_SELECT,
} from "@/lib/data/product-select";
import { getDb, newId, TABLES } from "@/lib/supabase/db";
import {
  productImageInputSchema,
  productOptionInputSchema,
  productSchema,
  productVariantInputSchema,
} from "@/lib/validations/admin";
import { slugify } from "@/lib/utils";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

function normalizeProductPayload(data: z.infer<typeof productSchema>) {
  return {
    ...data,
    slug: data.slug || slugify(data.name),
    description: data.description || null,
    sku: data.sku || null,
    compareCents: data.compareCents ?? null,
    categoryId: data.categoryId || null,
    seoTitle: data.seoTitle?.trim() || null,
    seoDescription: data.seoDescription?.trim() || null,
    tags: data.tags ?? [],
    brand: data.brand?.trim() || null,
    costCents: data.costCents ?? null,
    weightGrams: data.weightGrams ?? null,
    lengthCm: data.lengthCm ?? null,
    widthCm: data.widthCm ?? null,
    heightCm: data.heightCm ?? null,
    videoUrl: data.videoUrls?.[0]?.trim() || null,
    shippingMode: data.shippingMode ?? ShippingMode.CORREIOS,
    fixedShippingCents:
      data.shippingMode === ShippingMode.FIXED ? (data.fixedShippingCents ?? null) : null,
    active: data.status === ProductStatus.ACTIVE,
  };
}

export async function listProducts() {
  return withAdminRead(async () => {
    const { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_LIST_SELECT)
      .order("updatedAt", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => parseProductRow(row as Record<string, unknown>));
  });
}

export async function getProduct(id: string) {
  return withAdminRead(async () => {
    let { data, error } = await getDb()
      .from(TABLES.Product)
      .select(PRODUCT_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error && isProductDetailSelectError(error)) {
      ({ data, error } = await getDb()
        .from(TABLES.Product)
        .select(PRODUCT_LIST_SELECT)
        .eq("id", id)
        .maybeSingle());
    }
    if (error) throw error;
    return data ? parseProductRow(data as Record<string, unknown>) : null;
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
    const payload = { ...normalizeProductPayload(parsed.data), updatedAt: now };

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
    revalidateAdmin(["/admin/produtos", `/admin/produtos/${productId}`]);
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
    let { data: source, error } = await db
      .from(TABLES.Product)
      .select(PRODUCT_DETAIL_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error && isProductDetailSelectError(error)) {
      ({ data: source, error } = await db
        .from(TABLES.Product)
        .select(PRODUCT_LIST_SELECT)
        .eq("id", id)
        .maybeSingle());
    }
    if (error || !source) return { success: false, error: "Produto não encontrado" };

    const images = (source.ProductImage as Record<string, unknown>[]) ?? [];
    const copyId = newId();
    const now = new Date().toISOString();
    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      Category: _cat,
      ProductImage: _imgs,
      ProductOption: _opts,
      ProductVariant: _vars,
      ...productFields
    } = source as Record<string, unknown>;

    const { error: createErr } = await db.from(TABLES.Product).insert({
      ...productFields,
      id: copyId,
      name: `${source.name} (cópia)`,
      slug: `${source.slug}-copia-${Date.now()}`,
      sku: source.sku ? `${source.sku}-COPY` : null,
      active: false,
      status: ProductStatus.DRAFT,
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
    revalidateAdmin(["/admin/produtos", `/admin/produtos/${productId}`]);
    return { success: true };
  });
}

export async function syncProductOptions(
  productId: string,
  options: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = z.array(productOptionInputSchema).safeParse(options);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors.join(", ") };
    }

    const db = getDb();
    const { data: existingOpts } = await db
      .from(TABLES.ProductOption)
      .select("id")
      .eq("productId", productId);
    const optIds = (existingOpts ?? []).map((o) => o.id as string);
    if (optIds.length) {
      await db.from(TABLES.ProductOptionValue).delete().in("optionId", optIds);
    }
    await db.from(TABLES.ProductOption).delete().eq("productId", productId);

    for (const opt of parsed.data) {
      const optionId = newId();
      const { error: optErr } = await db.from(TABLES.ProductOption).insert({
        id: optionId,
        productId,
        name: opt.name,
        sortOrder: opt.sortOrder,
      });
      if (optErr) return { success: false, error: optErr.message };

      if (opt.values.length) {
        const { error: valErr } = await db.from(TABLES.ProductOptionValue).insert(
          opt.values.map((v) => ({
            id: newId(),
            optionId,
            value: v.value,
            sortOrder: v.sortOrder,
          })),
        );
        if (valErr) return { success: false, error: valErr.message };
      }
    }

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "Product",
      entityId: productId,
      metadata: { options: parsed.data.length },
    });
    revalidateAdmin(["/admin/produtos", `/admin/produtos/${productId}`]);
    return { success: true };
  });
}

export async function syncProductVariants(
  productId: string,
  variants: unknown,
): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = z.array(productVariantInputSchema).safeParse(variants);
    if (!parsed.success) {
      return { success: false, error: parsed.error.flatten().formErrors.join(", ") };
    }

    const db = getDb();
    await db.from(TABLES.ProductVariant).delete().eq("productId", productId);

    if (parsed.data.length) {
      const { error } = await db.from(TABLES.ProductVariant).insert(
        parsed.data.map((v) => ({
          id: newId(),
          productId,
          sku: v.sku || null,
          priceCents: v.priceCents ?? null,
          compareCents: v.compareCents ?? null,
          stock: v.stock,
          stockUnlimited: v.stockUnlimited,
          attributes: v.attributes,
          imageUrl: v.imageUrl?.trim() || null,
          sortOrder: v.sortOrder,
          active: v.active,
        })),
      );
      if (error) return { success: false, error: error.message };
    }

    await auditMutation(actor, {
      action: "UPDATE",
      entity: "Product",
      entityId: productId,
      metadata: { variants: parsed.data.length },
    });
    revalidateAdmin(["/admin/produtos", `/admin/produtos/${productId}`]);
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
