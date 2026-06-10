"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import type { ProductReviewPublic } from "@/lib/data/product-reviews";

function formatReviewDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 sm:h-5 sm:w-5 ${
            i < rating
              ? "fill-[var(--color-price)] text-[var(--color-price)]"
              : "fill-transparent text-[var(--color-card-border)]"
          }`}
          aria-hidden
        />
      ))}
    </div>
  );
}

export function ProductReviewCard({ review }: { review: ProductReviewPublic }) {
  return (
    <article className="rounded-xl border border-[var(--color-card-border)] bg-[var(--secondary)]/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StarRating rating={review.rating} />
          <p className="mt-2 font-medium text-[var(--color-brown)]">{review.authorName}</p>
          <time
            className="text-xs text-[var(--muted-foreground)]"
            dateTime={
              typeof review.createdAt === "string"
                ? review.createdAt
                : review.createdAt.toISOString()
            }
          >
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-brown-muted)] sm:text-base">
        {review.text}
      </p>

      {review.imageUrl ? (
        <div className="relative mt-4 aspect-[4/3] max-w-xs overflow-hidden rounded-lg border border-[var(--color-card-border)]">
          <Image
            src={review.imageUrl}
            alt={`Foto enviada por ${review.authorName}`}
            fill
            className="object-cover"
            sizes="320px"
          />
        </div>
      ) : null}
    </article>
  );
}
