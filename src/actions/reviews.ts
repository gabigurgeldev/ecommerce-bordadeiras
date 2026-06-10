"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  createProductReview,
  getProductSlugById,
  hasUserPurchasedProduct,
  hasUserReviewedProduct,
} from "@/lib/data/product-reviews";
import { ReviewSource } from "@/lib/types/database";
import { submitReviewSchema } from "@/lib/validations/reviews";

export type ReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export async function submitProductReview(input: {
  productId: string;
  rating: number;
  text: string;
  imageUrl?: string;
}): Promise<ReviewActionResult> {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, error: "Faça login para avaliar este produto." };
  }

  const parsed = submitReviewSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return { success: false, error: msg };
  }

  const { productId, rating, text, imageUrl } = parsed.data;

  const [purchased, alreadyReviewed] = await Promise.all([
    hasUserPurchasedProduct(user.id, productId),
    hasUserReviewedProduct(user.id, productId),
  ]);

  if (!purchased) {
    return {
      success: false,
      error: "Somente clientes que compraram este produto podem avaliar.",
    };
  }

  if (alreadyReviewed) {
    return { success: false, error: "Você já avaliou este produto." };
  }

  const authorName = user.name?.trim() || user.email.split("@")[0] || "Cliente";
  const review = await createProductReview({
    productId,
    userId: user.id,
    authorName,
    text,
    rating,
    imageUrl: imageUrl?.trim() || null,
    source: ReviewSource.USER,
  });

  if (!review) {
    return { success: false, error: "Não foi possível salvar sua avaliação. Tente novamente." };
  }

  const slug = await getProductSlugById(productId);
  if (slug) {
    revalidatePath(`/produto/${slug}`);
  }

  return { success: true };
}
