"use server";

import { revalidatePath } from "next/cache";
import { getOpenRouterConfig } from "@/lib/openrouter-config";
import { callOpenRouterJson, OpenRouterError } from "@/lib/openrouter/client";
import {
  createProductReviewsBatch,
  deleteProductReviewById,
  getProductSlugById,
  listProductReviewsAdmin,
} from "@/lib/data/product-reviews";
import { getDb, TABLES } from "@/lib/supabase/db";
import { ReviewSource, type ProductReview } from "@/lib/types/database";
import { productReviewsOutputSchema } from "@/lib/validations/ai";
import { entityIdSchema } from "@/lib/validations/ids";
import { generateReviewsCountSchema } from "@/lib/validations/reviews";
import { auditMutation, revalidateAdmin, withAdmin, withAdminRead, type ActionResult } from "./_utils";

const NOT_CONFIGURED =
  "Configure a API do OpenRouter em Configurações → Inteligência Artificial";

export async function listProductReviews(productId: string): Promise<ProductReview[]> {
  return withAdminRead(async () => {
    const parsed = entityIdSchema.safeParse(productId);
    if (!parsed.success) return [];
    return listProductReviewsAdmin(parsed.data);
  });
}

export async function deleteProductReview(reviewId: string): Promise<ActionResult> {
  return withAdmin(async (actor) => {
    const parsed = entityIdSchema.safeParse(reviewId);
    if (!parsed.success) {
      return { success: false, error: "Avaliação inválida" };
    }

    const db = getDb();
    const { data: review } = await db
      .from(TABLES.ProductReview)
      .select("productId")
      .eq("id", parsed.data)
      .maybeSingle();

    const deleted = await deleteProductReviewById(parsed.data);
    if (!deleted) {
      return { success: false, error: "Não foi possível excluir a avaliação" };
    }

    await auditMutation(actor, {
      action: "DELETE",
      entity: "ProductReview",
      entityId: parsed.data,
    });

    if (review?.productId) {
      const slug = await getProductSlugById(String(review.productId));
      if (slug) {
        await revalidateAdmin([`/produto/${slug}`, `/admin/produtos/${review.productId}`]);
      }
    }

    return { success: true };
  });
}

export async function generateProductReviewsWithAi(
  productId: string,
  count: number,
): Promise<ActionResult<{ created: number }>> {
  return withAdmin(async (actor) => {
    const idParsed = entityIdSchema.safeParse(productId);
    if (!idParsed.success) {
      return { success: false, error: "Produto inválido" };
    }

    const countParsed = generateReviewsCountSchema.safeParse(count);
    if (!countParsed.success) {
      return { success: false, error: "Quantidade deve ser entre 1 e 20" };
    }

    const db = getDb();
    const { data: product, error: productError } = await db
      .from(TABLES.Product)
      .select("id, name, description, categoryId")
      .eq("id", idParsed.data)
      .maybeSingle();

    if (productError || !product) {
      return { success: false, error: "Produto não encontrado" };
    }

    let categoryName = "";
    if (product.categoryId) {
      const { data: category } = await db
        .from(TABLES.Category)
        .select("name")
        .eq("id", String(product.categoryId))
        .maybeSingle();
      categoryName = category?.name ? String(category.name) : "";
    }

    const config = await getOpenRouterConfig();
    if (!config) {
      return { success: false, error: NOT_CONFIGURED };
    }

    const outputSchema = productReviewsOutputSchema;

    const plainDescription = String(product.description ?? "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 800);

    try {
      const raw = await callOpenRouterJson({
        apiKey: config.apiKey,
        model: config.model,
        context: "product",
        scope: "reviews",
        input: {
          name: String(product.name),
          description: plainDescription,
          category: categoryName,
          count: String(countParsed.data),
        },
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(raw);
      } catch {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      const outputParsed = outputSchema.safeParse(parsedJson);
      if (!outputParsed.success) {
        return { success: false, error: "Resposta inválida da IA, tente novamente" };
      }

      const reviewsToInsert = outputParsed.data.reviews.slice(0, countParsed.data).map((r) => ({
        productId: idParsed.data,
        authorName: r.authorName,
        text: r.text,
        rating: r.rating,
        source: ReviewSource.AI,
      }));

      const created = await createProductReviewsBatch(reviewsToInsert);
      if (created === 0) {
        return { success: false, error: "Não foi possível salvar as avaliações geradas" };
      }

      await auditMutation(actor, {
        action: "CREATE",
        entity: "ProductReview",
        entityId: idParsed.data,
        metadata: { source: "AI", count: created },
      });

      const slug = await getProductSlugById(idParsed.data);
      if (slug) {
        revalidatePath(`/produto/${slug}`);
      }
      revalidatePath(`/admin/produtos/${idParsed.data}`);

      return { success: true, data: { created } };
    } catch (e) {
      const message =
        e instanceof OpenRouterError ? e.message : "Erro ao gerar avaliações com IA";
      return { success: false, error: message };
    }
  });
}
