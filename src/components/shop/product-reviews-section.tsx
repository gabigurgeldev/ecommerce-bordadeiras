"use client";

import type {
  ProductReviewPublic,
  ProductReviewStats,
} from "@/lib/data/product-reviews";
import { Star } from "lucide-react";
import { ProductReviewCard } from "@/components/shop/product-review-card";
import { ProductReviewForm } from "@/components/shop/product-review-form";

type Props = {
  productId: string;
  productSlug: string;
  reviews: ProductReviewPublic[];
  stats: ProductReviewStats;
  isLoggedIn: boolean;
  canReview: boolean;
  existingUserReview: ProductReviewPublic | null;
};

function AverageStars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rounded
              ? "fill-[var(--color-price)] text-[var(--color-price)]"
              : "fill-transparent text-[var(--color-card-border)]"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ProductReviewsSection({
  productId,
  productSlug,
  reviews,
  stats,
  isLoggedIn,
  canReview,
  existingUserReview,
}: Props) {
  const loginCallbackUrl = `/produto/${productSlug}`;

  return (
    <section className="rounded-2xl border border-[var(--color-card-border)] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-brown)]">
            Avaliações
          </h2>
          {stats.count > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <AverageStars rating={stats.averageRating} />
              <span className="text-sm text-[var(--color-brown-muted)]">
                {stats.averageRating.toFixed(1)} · {stats.count}{" "}
                {stats.count === 1 ? "avaliação" : "avaliações"}
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Este produto ainda não tem avaliações.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {existingUserReview ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--color-brown)]">Sua avaliação</p>
            <ProductReviewCard review={existingUserReview} />
          </div>
        ) : (
          <ProductReviewForm
            productId={productId}
            isLoggedIn={isLoggedIn}
            canReview={canReview}
            loginCallbackUrl={loginCallbackUrl}
          />
        )}

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {existingUserReview ? (
              <h3 className="text-sm font-medium text-[var(--color-brown)]">
                Outras avaliações
              </h3>
            ) : null}
            <div className="grid gap-4">
              {reviews
                .filter((r) => r.id !== existingUserReview?.id)
                .map((review) => (
                  <ProductReviewCard key={review.id} review={review} />
                ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
